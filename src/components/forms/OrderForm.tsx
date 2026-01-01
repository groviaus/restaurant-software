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
import { MenuItem, Table, QuantityType } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Minus, X } from 'lucide-react';
import { useTableOrderStore } from '@/store/tableOrderStore';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  tables: Table[];
  onSuccess: () => void;
}

interface OrderItem {
  item_id: string;
  quantity: number;
  quantity_type?: QuantityType;
  notes?: string;
}

export function OrderForm({
  open,
  onOpenChange,
  outletId,
  tables,
  onSuccess,
}: OrderFormProps) {
  const { addOrder, tables: storeTables } = useTableOrderStore();
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableId, setTableId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Use store tables if available, fallback to props
  const availableTables = storeTables.length > 0 ? storeTables : tables;

  useEffect(() => {
    if (open) {
      fetchMenuItems();
      setItems([]);
      setTableId('');
      setOrderType('DINE_IN');
    }
  }, [open, outletId]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems((data.items || []).filter((item: MenuItem) => item.available));
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { item_id: '', quantity: 1, quantity_type: QuantityType.FULL, notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Helper function to check if item is Roti category
  const isRotiCategory = (itemId: string): boolean => {
    const menuItem = menuItems.find(m => m.id === itemId);
    return menuItem?.category?.toLowerCase() === 'roti';
  };

  // Helper function to get quantity type multiplier
  const getQuantityTypeMultiplier = (quantityType?: QuantityType): number => {
    switch (quantityType) {
      case QuantityType.QUARTER:
        return 0.25;
      case QuantityType.HALF:
        return 0.5;
      case QuantityType.THREE_QUARTER:
        return 0.75;
      case QuantityType.FULL:
        return 1.0;
      default:
        return 1.0;
    }
  };

  // Helper function to calculate effective price for an item
  const calculateItemPrice = (item: OrderItem): number => {
    const menuItem = menuItems.find(m => m.id === item.item_id);
    if (!menuItem) return 0;

    const multiplier = getQuantityTypeMultiplier(item.quantity_type);
    const effectivePrice = menuItem.price * multiplier;
    return effectivePrice * item.quantity;
  };

  // Calculate order total
  const calculateOrderTotal = (): number => {
    return items.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (orderType === 'DINE_IN' && !tableId) {
      toast.error('Please select a table for dine-in orders');
      return;
    }

    const invalidItems = items.some(item => !item.item_id || item.quantity <= 0);
    if (invalidItems) {
      toast.error('Please fill all item fields correctly');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: outletId,
          table_id: orderType === 'DINE_IN' ? tableId : undefined,
          order_type: orderType,
          items: items.map(item => ({
            item_id: item.item_id,
            quantity: item.quantity,
            quantity_type: item.quantity_type,
            notes: item.notes || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const orderData = await response.json();
      
      // Update store with new order (this will also update table status to OCCUPIED if DINE_IN)
      addOrder(orderData);

      toast.success('Order created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Add items to create a new order
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order_type">Order Type</Label>
            <Select
              value={orderType}
              onValueChange={(value) => {
                setOrderType(value as 'DINE_IN' | 'TAKEAWAY');
                if (value === 'TAKEAWAY') {
                  setTableId('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINE_IN">Dine In</SelectItem>
                <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {orderType === 'DINE_IN' && (
            <div>
              <Label htmlFor="table">Table</Label>
              <Select value={tableId} onValueChange={setTableId} required={orderType === 'DINE_IN'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables
                    .filter((table) => table.status === 'EMPTY' || table.status === 'BILLED')
                    .sort((a, b) => {
                      // Natural sort for table names (e.g., Table 2 before Table 10)
                      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                    })
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name} (Capacity: {table.capacity || 'N/A'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label>Item</Label>
                        <Select
                          value={item.item_id}
                          onValueChange={(value) => {
                            const selectedMenuItem = menuItems.find(m => m.id === value);
                            const isRoti = selectedMenuItem?.category?.toLowerCase() === 'roti';
                            
                            // Update item with appropriate quantity_type
                            const updated = [...items];
                            updated[index] = {
                              ...updated[index],
                              item_id: value,
                              quantity_type: isRoti ? undefined : (updated[index].quantity_type || QuantityType.FULL),
                            };
                            setItems(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuItems.map((menuItem) => (
                              <SelectItem key={menuItem.id} value={menuItem.id}>
                                {menuItem.name} - ₹{menuItem.price}{menuItem.category?.toLowerCase() === 'roti' ? '/piece' : '/kg'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className={isRotiCategory(item.item_id) ? '' : 'grid grid-cols-2 gap-2'}>
                        {!isRotiCategory(item.item_id) && (
                        <div>
                          <Label>Quantity Type</Label>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={item.quantity_type === QuantityType.QUARTER ? 'default' : 'outline'}
                              onClick={() => updateItem(index, 'quantity_type', QuantityType.QUARTER)}
                              className="text-xs"
                            >
                              250gm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.quantity_type === QuantityType.HALF ? 'default' : 'outline'}
                              onClick={() => updateItem(index, 'quantity_type', QuantityType.HALF)}
                              className="text-xs"
                            >
                              500gm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.quantity_type === QuantityType.THREE_QUARTER ? 'default' : 'outline'}
                              onClick={() => updateItem(index, 'quantity_type', QuantityType.THREE_QUARTER)}
                              className="text-xs"
                            >
                              750gm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.quantity_type === QuantityType.FULL ? 'default' : 'outline'}
                              onClick={() => updateItem(index, 'quantity_type', QuantityType.FULL)}
                              className="text-xs"
                            >
                              1kg
                            </Button>
                          </div>
                        </div>
                        )}
                        <div>
                          <Label>Quantity</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {item.item_id && (
                    <div className="bg-gray-50 rounded p-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {isRotiCategory(item.item_id) ? (
                            <>Base Price (per piece): ₹{menuItems.find(m => m.id === item.item_id)?.price.toFixed(2)}</>
                          ) : (
                            <>Base Price (per kg): ₹{menuItems.find(m => m.id === item.item_id)?.price.toFixed(2)}</>
                          )}
                        </span>
                        <span className="font-semibold text-primary">
                          Item Total: ₹{calculateItemPrice(item).toFixed(2)}
                        </span>
                      </div>
                      {!isRotiCategory(item.item_id) && item.quantity_type && item.quantity_type !== QuantityType.FULL && (
                        <div className="text-xs text-gray-500 mt-1">
                          Price for selected quantity: ₹{(menuItems.find(m => m.id === item.item_id)?.price || 0) * getQuantityTypeMultiplier(item.quantity_type)} × {item.quantity} = ₹{calculateItemPrice(item).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={item.notes || ''}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Click "Add Item" to start adding items to the order
                </p>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{calculateOrderTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST):</span>
                  <span className="font-medium">₹{(calculateOrderTotal() * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">₹{(calculateOrderTotal() * 1.18).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

