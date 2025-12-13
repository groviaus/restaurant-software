'use client';

import { useState } from 'react';
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

interface InventoryTableProps {
  inventory: Inventory[];
  logs: InventoryLog[];
  outletId: string;
}

export function InventoryTable({ inventory, logs, outletId }: InventoryTableProps) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formOpen, setFormOpen] = useState(false);

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
        <TabsList>
          <TabsTrigger value="inventory">Current Stock</TabsTrigger>
          <TabsTrigger value="logs">Inventory Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAdd}>
              <Package className="h-4 w-4 mr-2" />
              Add/Update Stock
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Low Stock Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No inventory items found. Add stock for menu items.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.item?.name || 'Unknown Item'}
                      </TableCell>
                      <TableCell>{item.item?.category || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {item.stock}
                      </TableCell>
                      <TableCell>{item.low_stock_threshold}</TableCell>
                      <TableCell>
                        {isLowStock(item) ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
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
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No inventory logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.item?.name || 'Unknown Item'}
                      </TableCell>
                      <TableCell>
                        <span className={log.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.change >= 0 ? '+' : ''}{log.change}
                        </span>
                      </TableCell>
                      <TableCell>{log.reason}</TableCell>
                      <TableCell>
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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

