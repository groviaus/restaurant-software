'use client';

import { useRouter } from 'next/navigation';
import { Table } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TableStatus } from '@/lib/types';
import { TableForm } from '@/components/forms/TableForm';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { cn } from '@/lib/utils';
import { useRealtimeTables } from '@/hooks/useRealtime';

interface TableGridProps {
  tables: Table[];
  outletId: string;
  onRefresh?: () => void;
}

export function TableGrid({ tables: initialTables, outletId, onRefresh }: TableGridProps) {
  const router = useRouter();
  const { tables: storeTables, setTables } = useTableOrderStore();
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'ALL'>('ALL');

  // Initialize store with tables from server
  useEffect(() => {
    if (initialTables && initialTables.length > 0) {
      setTables(initialTables);
    }
  }, [initialTables, setTables]);

  // Use store tables, fallback to initialTables
  const tables = storeTables.length > 0 ? storeTables : initialTables;

  // Function to refetch tables from API
  const refetchTables = useCallback(async () => {
    try {
      console.log('[TableGrid] Refetching tables...');
      const response = await fetch(`/api/tables?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns { tables: [...] } or just array
        const tablesData = data.tables || data || [];
        console.log('[TableGrid] Refetched tables:', tablesData.length, 'tables');
        setTables(Array.isArray(tablesData) ? tablesData : []);
        router.refresh();
      } else {
        const errorText = await response.text();
        console.error('[TableGrid] Failed to refetch tables:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('[TableGrid] Failed to refetch tables:', error);
    }
  }, [outletId, setTables, router]);

  // Subscribe to real-time table changes
  useRealtimeTables({
    outletId,
    onChange: (payload) => {
      console.log('[TableGrid] Realtime table change received:', payload.eventType);
      // Refetch tables when any change happens on another device
      refetchTables();
    },
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'EMPTY':
        return 'bg-green-100 text-green-800';
      case 'OCCUPIED':
        return 'bg-yellow-100 text-yellow-800';
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
      // Update store by removing the deleted table
      const updatedTables = tables.filter(t => t.id !== id);
      setTables(updatedTables);
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

  // Filter and sort tables
  // Convert BILLED status to EMPTY for display, then filter by status
  const filteredAndSortedTables = tables
    .map(table => ({
      ...table,
      // Convert BILLED to EMPTY for display purposes
      status: table.status === TableStatus.BILLED ? TableStatus.EMPTY : table.status
    }))
    .filter(table => statusFilter === 'ALL' || table.status === statusFilter)
    .sort((a, b) => {
      // Natural sort for table names (e.g., Table 1, Table 2, Table 10)
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

  // Count tables for filter buttons (treating BILLED as EMPTY)
  const emptyCount = tables.filter(t => t.status === TableStatus.EMPTY || t.status === TableStatus.BILLED).length;
  const occupiedCount = tables.filter(t => t.status === TableStatus.OCCUPIED).length;

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('ALL')}
            className="flex-1 sm:flex-none"
          >
            All ({tables.length})
          </Button>
          <Button
            variant={statusFilter === TableStatus.EMPTY ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(TableStatus.EMPTY)}
            className={cn(
              'flex-1 sm:flex-none',
              statusFilter === TableStatus.EMPTY ? '' : 'text-green-700 border-green-300 hover:bg-green-50'
            )}
          >
            Empty ({emptyCount})
          </Button>
          <Button
            variant={statusFilter === TableStatus.OCCUPIED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(TableStatus.OCCUPIED)}
            className={cn(
              'flex-1 sm:flex-none',
              statusFilter === TableStatus.OCCUPIED ? '' : 'text-yellow-700 border-yellow-300 hover:bg-yellow-50'
            )}
          >
            Occupied ({occupiedCount})
          </Button>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">Add Table</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filteredAndSortedTables.map((table) => (
        <Card key={table.id} className="p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{table.name}</h3>
              {table.capacity && (
                <p className="text-xs sm:text-sm text-gray-600">Capacity: {table.capacity}</p>
              )}
              <Badge className={`mt-2 ${getStatusColor(table.status)}`}>
                {table.status}
              </Badge>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(table)}
                className="h-8 w-8 sm:h-9 sm:w-9"
                aria-label="Edit table"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(table.id)}
                className="h-8 w-8 sm:h-9 sm:w-9"
                aria-label="Delete table"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
        {filteredAndSortedTables.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8 text-sm sm:text-base">
            {tables.length === 0
              ? 'No tables found. Add your first table to get started.'
              : `No ${statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} tables found.`
            }
          </div>
        )}
      </div>
      <TableForm
        open={formOpen}
        onOpenChange={setFormOpen}
        table={editingTable}
        outletId={outletId}
        onSuccess={async () => {
          // Refresh tables from server to get latest data
          router.refresh();
          onRefresh?.();
        }}
      />
    </>
  );
}

