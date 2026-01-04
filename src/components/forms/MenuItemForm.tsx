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
import { Checkbox } from '@/components/ui/checkbox';
import { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest } from '@/lib/types';
import { toast } from 'sonner';

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem | null;
  outletId: string;
  onSuccess: () => void;
}

export function MenuItemForm({
  open,
  onOpenChange,
  menuItem,
  outletId,
  onSuccess,
}: MenuItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMenuItemRequest>({
    outlet_id: outletId,
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    image_url: '',
  });

  useEffect(() => {
    if (menuItem) {
      setFormData({
        outlet_id: menuItem.outlet_id,
        name: menuItem.name,
        description: menuItem.description || '',
        price: menuItem.price,
        category: menuItem.category || '',
        available: menuItem.available,
        image_url: menuItem.image_url || '',
      });
    } else {
      setFormData({
        outlet_id: outletId,
        name: '',
        description: '',
        price: 0,
        category: '',
        available: true,
        image_url: '',
      });
    }
  }, [menuItem, outletId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = menuItem ? `/api/menu/${menuItem.id}` : '/api/menu';
      const method = menuItem ? 'PATCH' : 'POST';

      // Convert empty image_url to null
      const submitData = {
        ...formData,
        image_url: formData.image_url?.trim() || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save menu item');
      }

      toast.success(menuItem ? 'Menu item updated' : 'Menu item created');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{menuItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {menuItem ? 'Update the menu item details' : 'Add a new item to the menu'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Special Nihari"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of the item"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="price" className="text-xs sm:text-sm">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="h-11 sm:h-10 text-base sm:text-sm"
                required
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
              <Input
                id="category"
                placeholder="e.g. Main Course"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="image_url" className="text-xs sm:text-sm">Image URL (Optional)</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, available: checked as boolean })
              }
              className="h-5 w-5"
            />
            <Label htmlFor="available" className="text-xs sm:text-sm cursor-pointer select-none">
              Item available for ordering
            </Label>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-11 sm:h-10 mt-2 sm:mt-0">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 sm:h-10">
              {loading ? 'Saving...' : menuItem ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

