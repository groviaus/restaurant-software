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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MenuItem } from '@/lib/types';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/menu/${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();

        if (error.error?.includes('foreign key constraint') || error.error?.includes('order_items')) {
          const updateResponse = await fetch(`/api/menu/${itemToDelete}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ available: false }),
          });

          if (updateResponse.ok) {
            toast.warning('Item has existing orders and was marked as unavailable instead of deleted');
            router.refresh();
            onRefresh?.();
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            return;
          }
        }

        throw new Error(error.error || 'Failed to delete menu item');
      }

      toast.success('Menu item deleted');
      router.refresh();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete menu item');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to delete');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setDeleting(true);
    setBulkDeleteDialogOpen(false);

    let deletedCount = 0;
    let softDeletedCount = 0;
    let failedCount = 0;

    try {
      for (const itemId of selectedItems) {
        try {
          const response = await fetch(`/api/menu/${itemId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();

            if (error.error?.includes('foreign key constraint') || error.error?.includes('order_items')) {
              const updateResponse = await fetch(`/api/menu/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available: false }),
              });

              if (updateResponse.ok) {
                softDeletedCount++;
              } else {
                failedCount++;
              }
            } else {
              failedCount++;
            }
          } else {
            deletedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      const messages = [];
      if (deletedCount > 0) messages.push(`${deletedCount} deleted`);
      if (softDeletedCount > 0) messages.push(`${softDeletedCount} marked unavailable (had orders)`);
      if (failedCount > 0) messages.push(`${failedCount} failed`);

      if (deletedCount > 0 || softDeletedCount > 0) {
        toast.success(messages.join(', '));
      } else {
        toast.error('Failed to delete items');
      }

      setSelectedItems(new Set());
      router.refresh();
      onRefresh?.();
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length;

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">
            Total items: {items.length}
          </p>
          {selectedItems.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={openBulkDeleteDialog}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all items"
                    className={someSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                  />
                </TableHead>
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
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No menu items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell className="font-medium text-gray-900">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={item.available ? 'default' : 'secondary'}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          aria-label="Edit item"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Menu Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this menu item? This action cannot be undone.
              {itemToDelete && items.find(i => i.id === itemToDelete) && (
                <span className="block mt-2 font-medium text-gray-900">
                  "{items.find(i => i.id === itemToDelete)?.name}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Multiple Items
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.size} menu item{selectedItems.size > 1 ? 's' : ''}?
              This action cannot be undone.
              <span className="block mt-2 text-sm text-gray-600">
                Items with existing orders will be marked as unavailable instead of being deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete {selectedItems.size} Item{selectedItems.size > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
