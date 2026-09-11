'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, CreateTableRequest, TableStatus } from '@/lib/types';
import { toast } from 'sonner';
import { useCreateTableMutation, useUpdateTableMutation } from '@/hooks/mutations/useTableMutations';
import { Utensils, Users, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: Table | null;
  outletId: string;
  onSuccess: () => void;
  nextTableNumber?: number;
}

interface TableFormInnerProps {
  table?: Table | null;
  outletId: string;
  onSuccess: () => void;
  onClose: () => void;
  nextTableNumber?: number;
}

function TableFormInner({
  table,
  outletId,
  onSuccess,
  onClose,
  nextTableNumber,
}: TableFormInnerProps) {
  const createTableMutation = useCreateTableMutation();
  const updateTableMutation = useUpdateTableMutation();
  const loading = createTableMutation.isPending || updateTableMutation.isPending;

  const [formData, setFormData] = useState<CreateTableRequest>(() => ({
    outlet_id: outletId,
    name: table?.name ?? (nextTableNumber ? `Table ${nextTableNumber}` : ''),
    capacity: table?.capacity ?? 4,
    status: table?.status ?? TableStatus.EMPTY,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please provide a table name or number');
      return;
    }

    try {
      if (table) {
        await updateTableMutation.mutateAsync({ id: table.id, ...formData });
      } else {
        await createTableMutation.mutateAsync(formData);
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save table';
      toast.error(msg);
    }
  };

  const capacityPresets = [2, 4, 6, 8, 10, 12];
  const namePrefixes = ['Table', 'Booth', 'Window', 'Patio', 'Bar'];

  return (
    <DialogContent className="w-full sm:max-w-[500px] rounded-2xl p-4 sm:p-6 bg-card border-border/70 shadow-2xl space-y-4">
      <DialogHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Utensils className="h-4 w-4" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
            {table ? 'Edit Table Details' : 'Add New Dining Table'}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
          {table
            ? 'Update table seating capacity and name for your floor layout.'
            : 'Add a new table to your floor plan to seat guests and take dine-in orders.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Table Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tableName" className="text-xs sm:text-sm font-semibold text-foreground">
              Table Name / Number <span className="text-rose-500">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground">e.g. Table 1, Window 4</span>
          </div>

          <Input
            id="tableName"
            placeholder="e.g. Table 1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-10 text-sm bg-background border-border/70"
            required
          />

          {/* Quick Prefix Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium mr-1 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" /> Quick:
            </span>
            {namePrefixes.map((prefix) => (
              <button
                key={prefix}
                type="button"
                onClick={() => {
                  const num = nextTableNumber || 1;
                  setFormData({ ...formData, name: `${prefix} ${num}` });
                }}
                className="h-6 px-2 text-[11px] font-medium rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/50"
              >
                {prefix}
              </button>
            ))}
          </div>
        </div>

        {/* Seating Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="capacity" className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Guest Seating Capacity</span>
            </Label>
            <span className="text-xs font-mono font-bold text-primary">
              {formData.capacity || 0} {formData.capacity === 1 ? 'Guest' : 'Guests'}
            </span>
          </div>

          <Input
            id="capacity"
            type="number"
            min="1"
            max="50"
            placeholder="Number of seats"
            value={formData.capacity || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                capacity: parseInt(e.target.value) || undefined,
              })
            }
            className="h-10 text-sm bg-background border-border/70"
          />

          {/* Quick Capacity Preset Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {capacityPresets.map((seats) => {
              const isSelected = formData.capacity === seats;
              return (
                <button
                  key={seats}
                  type="button"
                  onClick={() => setFormData({ ...formData, capacity: seats })}
                  className={cn(
                    'h-7 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                  )}
                >
                  {seats} Seats
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Status (Only when editing) */}
        {table && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <Label className="text-xs sm:text-sm font-semibold text-foreground">Table Status</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: TableStatus.EMPTY })}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-1.5',
                  formData.status === TableStatus.EMPTY
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/60'
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Available / Empty</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: TableStatus.OCCUPIED })}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-1.5',
                  formData.status === TableStatus.OCCUPIED
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/60'
                )}
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>Occupied</span>
              </button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-border/60 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-10 text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{loading ? 'Saving...' : table ? 'Update Table' : 'Create Table'}</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function TableForm({
  open,
  onOpenChange,
  table,
  outletId,
  onSuccess,
  nextTableNumber,
}: TableFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <TableFormInner
          key={table?.id ?? 'new'}
          table={table}
          outletId={outletId}
          onSuccess={onSuccess}
          onClose={() => onOpenChange(false)}
          nextTableNumber={nextTableNumber}
        />
      )}
    </Dialog>
  );
}
