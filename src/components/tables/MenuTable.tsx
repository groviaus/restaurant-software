'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MenuItem, PricingMode, QuantityType } from '@/lib/types';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { Pencil, Trash2, Plus, AlertTriangle, Tag, IndianRupee, TrendingUp } from 'lucide-react';
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
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            Total items: <span className="font-semibold">{items.length}</span>
          </p>
          {selectedItems.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={openBulkDeleteDialog}
              disabled={deleting}
              className="text-xs sm:text-sm"
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

      {/* Select All Checkbox */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all items"
            className={`!h-4 !w-4 flex-shrink-0 ${someSelected ? 'data-[state=checked]:bg-gray-400' : ''}`}
          />
          <span className="text-sm text-gray-600">
            {selectedItems.size > 0
              ? `${selectedItems.size} of ${items.length} selected`
              : 'Select all items'}
          </span>
        </div>
      )}

      {/* Card Grid Layout */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No menu items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`hover:shadow-md transition-all duration-200 border ${
                selectedItems.has(item.id) ? 'ring-2 ring-primary border-primary' : ''
              } ${!item.available ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-5">
                {/* Header with Checkbox */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      aria-label={`Select ${item.name}`}
                      className="!h-4 !w-4 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.category && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Tag className="h-3 w-3" />
                          <span className="truncate">{item.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}

                {/* Price and Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <IndianRupee className="h-4 w-4" />
                      <span className="font-medium">Price</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{item.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Pricing Mode Info */}
                  {item.pricing_mode !== PricingMode.FIXED && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {item.pricing_mode === PricingMode.QUANTITY_AUTO && 'Auto-calculated by quantity'}
                      {item.pricing_mode === PricingMode.QUANTITY_MANUAL && 'Manual pricing by quantity'}
                      {item.requires_quantity && item.available_quantity_types && item.available_quantity_types.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.available_quantity_types.map((qType) => (
                            <span key={qType} className="text-[10px] bg-white px-1.5 py-0.5 rounded">
                              {qType === QuantityType.QUARTER && 'Q'}
                              {qType === QuantityType.HALF && 'H'}
                              {qType === QuantityType.THREE_QUARTER && '3Q'}
                              {qType === QuantityType.FULL && 'F'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profit Margin */}
                  {item.profit_margin_percent && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>Margin: {item.profit_margin_percent}%</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-3">
                  <Badge variant={item.available ? 'default' : 'secondary'} className="text-xs">
                    {item.available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1 text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
