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
import { Table, CreateTableRequest } from '@/lib/types';
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
    status: 'EMPTY',
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
        status: 'EMPTY',
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
          <DialogDescription>
            {table ? 'Update the table details' : 'Add a new table'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Table Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : table ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

