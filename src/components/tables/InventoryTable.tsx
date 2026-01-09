'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inventory, InventoryLog } from '@/lib/types';
import { InventoryForm } from '@/components/forms/InventoryForm';
import { Package, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useRealtimeInventory, useRealtimeInventoryLogs } from '@/hooks/useRealtime';

interface InventoryTableProps {
  inventory: Inventory[];
  logs: InventoryLog[];
  outletId: string;
}

export function InventoryTable({ inventory: initialInventory, logs: initialLogs, outletId }: InventoryTableProps) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [inventory, setInventory] = useState<Inventory[]>(initialInventory);
  const [logs, setLogs] = useState<InventoryLog[]>(initialLogs);

  // Update state when props change (e.g., from server refresh)
  useEffect(() => {
    setInventory(initialInventory);
    setLogs(initialLogs);
  }, [initialInventory, initialLogs]);

  // Function to refetch inventory from API
  const refetchInventory = useCallback(async () => {
    try {
      console.log('[InventoryTable] Refetching inventory...');
      const response = await fetch(`/api/inventory?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        const inventoryData = data.inventory || data || [];
        console.log('[InventoryTable] Refetched inventory:', inventoryData.length, 'items');
        if (Array.isArray(inventoryData)) {
          setInventory(inventoryData);
        }
      } else {
        const errorText = await response.text();
        console.error('[InventoryTable] Failed to refetch inventory:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('[InventoryTable] Failed to refetch inventory:', error);
    }
  }, [outletId]);

  // Function to refetch inventory logs from API
  const refetchLogs = useCallback(async () => {
    try {
      console.log('[InventoryTable] Refetching inventory logs...');
      // Fetch logs from the page's server component via router refresh
      router.refresh();
    } catch (error) {
      console.error('[InventoryTable] Failed to refetch logs:', error);
    }
  }, [router]);

  // Subscribe to real-time inventory changes
  useRealtimeInventory({
    outletId,
    onChange: (payload) => {
      console.log('[InventoryTable] Realtime inventory change received:', payload.eventType);
      refetchInventory();
      router.refresh();
    },
    onInsert: (payload) => {
      console.log('[InventoryTable] New inventory item inserted');
      refetchInventory();
      router.refresh();
    },
    onUpdate: (payload) => {
      console.log('[InventoryTable] Inventory item updated');
      refetchInventory();
      refetchLogs(); // Also refresh logs when inventory is updated
      router.refresh();
    },
  });

  // Subscribe to real-time inventory logs changes
  useRealtimeInventoryLogs({
    outletId,
    onChange: (payload) => {
      console.log('[InventoryTable] Realtime inventory log change received:', payload.eventType);
      refetchLogs();
      router.refresh();
    },
  });

  const handleEdit = (item: Inventory) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const isLowStock = (item: Inventory) => {
    return item.stock <= item.low_stock_threshold;
  };

  return (
    <>
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex overflow-x-auto h-auto p-1 bg-muted rounded-lg">
          <TabsTrigger value="inventory" className="flex-1 sm:flex-none py-2 text-xs sm:text-sm">Current Stock</TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 sm:flex-none py-2 text-xs sm:text-sm">Inventory Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAdd} className="w-full sm:w-auto h-11 sm:h-9">
              <Package className="h-4 w-4 mr-2" />
              <span>Add/Update Stock</span>
            </Button>
          </div>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Item</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[100px]">Current Stock</TableHead>
                    <TableHead className="min-w-[120px]">Threshold</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No inventory items found. Add stock for menu items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {item.item?.name || 'Unknown Item'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{item.item?.category || '-'}</TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {item.stock}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{item.low_stock_threshold}</TableCell>
                        <TableCell>
                          {isLowStock(item) ? (
                            <Badge variant="destructive" className="gap-1 text-[10px] sm:text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-[10px] sm:text-xs">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 sm:h-9"
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Item</TableHead>
                    <TableHead className="min-w-[80px]">Change</TableHead>
                    <TableHead className="min-w-[150px]">Reason</TableHead>
                    <TableHead className="min-w-[140px]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No inventory logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {log.item?.name || 'Unknown Item'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <span className={log.change >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {log.change >= 0 ? '+' : ''}{log.change}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{log.reason}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <InventoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        inventory={editingItem}
        outletId={outletId}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}

