'use client';

import { useState, useEffect } from 'react';
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

interface TableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: Table | null;
  outletId: string;
  onSuccess: () => void;
}

export function TableForm({
  open,
  onOpenChange,
  table,
  outletId,
  onSuccess,
}: TableFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTableRequest>({
    outlet_id: outletId,
    name: '',
    capacity: undefined,
    status: TableStatus.EMPTY,
  });

  useEffect(() => {
    if (table) {
      setFormData({
        outlet_id: table.outlet_id,
        name: table.name,
        capacity: table.capacity || undefined,
        status: table.status,
      });
    } else {
      setFormData({
        outlet_id: outletId,
        name: '',
        capacity: undefined,
        status: TableStatus.EMPTY,
      });
    }
  }, [table, outletId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = table ? `/api/tables/${table.id}` : '/api/tables';
      const method = table ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save table');
      }

      toast.success(table ? 'Table updated' : 'Table created');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{table ? 'Edit Table' : 'Add Table'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {table ? 'Update the table details' : 'Add a new table'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Table Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Table 1, Window Side"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="capacity" className="text-xs sm:text-sm">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="Number of seats"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-11 sm:h-10 mt-2 sm:mt-0">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 sm:h-10">
              {loading ? 'Saving...' : table ? 'Update Table' : 'Create Table'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

