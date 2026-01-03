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
import { MenuItem } from '@/lib/types';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MenuTableProps {
  items: MenuItem[];
  outletId: string;
  onRefresh?: () => void;
}

export function MenuTable({ items, outletId, onRefresh }: MenuTableProps) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete menu item');
      }

      toast.success('Menu item deleted');
      router.refresh();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete menu item');
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-xs sm:text-sm text-gray-600">
          Total items: {items.length}
        </p>
        <Button onClick={handleAdd} className="w-full sm:w-auto h-11 sm:h-9">
          Add Menu Item
        </Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto text-responsive-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[120px]">Category</TableHead>
                <TableHead className="min-w-[100px]">Price</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="text-right min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No menu items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.category || '-'}</TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium text-gray-900">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={item.available ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                        {item.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          aria-label="Edit item"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 sm:h-9 sm:w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <MenuItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        menuItem={editingItem}
        outletId={outletId}
        onSuccess={() => {
          router.refresh();
          onRefresh?.();
        }}
      />
    </>
  );
}

