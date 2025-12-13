'use client';

import { useRouter } from 'next/navigation';
import { Table } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TableStatus } from '@/lib/types';
import { TableForm } from '@/components/forms/TableForm';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TableGridProps {
  tables: Table[];
  outletId: string;
  onRefresh?: () => void;
}

export function TableGrid({ tables, outletId, onRefresh }: TableGridProps) {
  const router = useRouter();
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'EMPTY':
        return 'bg-green-100 text-green-800';
      case 'OCCUPIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'BILLED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete table');
      }

      toast.success('Table deleted');
      router.refresh();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete table');
    }
  };

  const handleAdd = () => {
    setEditingTable(null);
    setFormOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleAdd}>Add Table</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <Card key={table.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{table.name}</h3>
                {table.capacity && (
                  <p className="text-sm text-gray-600">Capacity: {table.capacity}</p>
                )}
                <Badge className={`mt-2 ${getStatusColor(table.status)}`}>
                  {table.status}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(table)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(table.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No tables found. Add your first table to get started.
          </div>
        )}
      </div>
      <TableForm
        open={formOpen}
        onOpenChange={setFormOpen}
        table={editingTable}
        outletId={outletId}
        onSuccess={() => {
          router.refresh();
          onRefresh?.();
        }}
      />
    </>
  );
}

