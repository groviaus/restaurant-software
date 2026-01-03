'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Inventory } from '@/lib/types';
import { toast } from 'sonner';

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
  outletId: string;
  onSuccess: () => void;
}

export function InventoryForm({
  open,
  onOpenChange,
  inventory,
  outletId,
  onSuccess,
}: InventoryFormProps) {
  const [itemId, setItemId] = useState('');
  const [stock, setStock] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (open) {
      fetchItems();
      if (inventory) {
        setItemId(inventory.item_id);
        setStock(inventory.stock.toString());
        setThreshold(inventory.low_stock_threshold.toString());
      } else {
        setItemId('');
        setStock('');
        setThreshold('10');
      }
    }
  }, [open, inventory]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/menu?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setItems((data.items || []).map((item: any) => ({ id: item.id, name: item.name })));
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          stock: parseFloat(stock),
          low_stock_threshold: parseFloat(threshold),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update inventory');
      }

      toast.success('Inventory updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {inventory ? 'Update Inventory' : 'Add Stock'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {inventory
              ? 'Update stock levels for this item'
              : 'Add stock tracking for a menu item'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="item" className="text-xs sm:text-sm">Menu Item</Label>
            <Select
              value={itemId}
              onValueChange={setItemId}
              disabled={!!inventory}
              required
            >
              <SelectTrigger id="item" className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="stock" className="text-xs sm:text-sm">Current Stock</Label>
            <Input
              id="stock"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="threshold" className="text-xs sm:text-sm">Low Stock Threshold</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 10"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-11 sm:h-10 mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 sm:h-10">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

