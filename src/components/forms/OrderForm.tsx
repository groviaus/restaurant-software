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
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b">
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Add items to create a new order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="order_type" className="text-xs sm:text-sm">Order Type</Label>
                <Select
                  value={orderType}
                  onValueChange={(value) => {
                    setOrderType(value as 'DINE_IN' | 'TAKEAWAY');
                    if (value === 'TAKEAWAY') {
                      setTableId('');
                    }
                  }}
                >
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DINE_IN">Dine In</SelectItem>
                    <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === 'DINE_IN' && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="table" className="text-xs sm:text-sm">Table</Label>
                  <Select value={tableId} onValueChange={setTableId} required={orderType === 'DINE_IN'}>
                    <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables
                        .filter((table) => table.status === 'EMPTY' || table.status === 'BILLED')
                        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                        .map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name} ({table.capacity || 'N/A'})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center sticky top-0 bg-white py-1 z-10 border-b border-dashed">
                <Label className="text-sm sm:text-base font-semibold">Order Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-9 sm:h-8 px-3">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-xl p-3 sm:p-4 space-y-3 bg-white shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-full"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3 pr-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm">Item</Label>
                        <Select
                          value={item.item_id}
                          onValueChange={(value) => {
                            const selectedMenuItem = menuItems.find(m => m.id === value);
                            const isRoti = selectedMenuItem?.category?.toLowerCase() === 'roti';
                            const updated = [...items];
                            updated[index] = {
                              ...updated[index],
                              item_id: value,
                              quantity_type: isRoti ? undefined : (updated[index].quantity_type || QuantityType.FULL),
                            };
                            setItems(updated);
                          }}
                        >
                          <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuItems.map((menuItem) => (
                              <SelectItem key={menuItem.id} value={menuItem.id}>
                                {menuItem.name} (₹{menuItem.price})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isRotiCategory(item.item_id) && (
                          <div className="space-y-1.5">
                            <Label className="text-xs sm:text-sm">Size</Label>
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { label: '¼kg', val: QuantityType.QUARTER },
                                { label: '½kg', val: QuantityType.HALF },
                                { label: '¾kg', val: QuantityType.THREE_QUARTER },
                                { label: '1kg', val: QuantityType.FULL }
                              ].map((opt) => (
                                <Button
                                  key={opt.val}
                                  type="button"
                                  size="sm"
                                  variant={item.quantity_type === opt.val ? 'default' : 'outline'}
                                  onClick={() => updateItem(index, 'quantity_type', opt.val)}
                                  className="text-[10px] sm:text-xs h-9 sm:h-8 px-1"
                                >
                                  {opt.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm">{isRotiCategory(item.item_id) ? 'Pieces' : 'Quantity'}</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                              className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="h-11 sm:h-10 text-center text-base sm:text-sm font-semibold w-16"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                              className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm">Special Instructions (Optional)</Label>
                        <Input
                          value={item.notes || ''}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          placeholder="e.g. Extra spicy, less oil"
                          className="h-11 sm:h-10 text-base sm:text-sm"
                        />
                      </div>
                    </div>

                    {item.item_id && (
                      <div className="bg-muted/50 rounded-lg p-3 text-xs sm:text-sm flex justify-between items-center mt-2 border border-dashed border-gray-200">
                        <div className="text-gray-600 flex flex-col">
                          <span className="font-medium">
                            {isRotiCategory(item.item_id) ? '₹' + menuItems.find(m => m.id === item.item_id)?.price.toFixed(2) + ' per piece' : '₹' + menuItems.find(m => m.id === item.item_id)?.price.toFixed(2) + ' per kg'}
                          </span>
                          {!isRotiCategory(item.item_id) && item.quantity_type && item.quantity_type !== QuantityType.FULL && (
                            <span className="text-[10px] text-gray-400">
                              Base: ₹{((menuItems.find(m => m.id === item.item_id)?.price || 0) * getQuantityTypeMultiplier(item.quantity_type)).toFixed(2)} for {item.quantity_type.toLowerCase().replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 block text-[10px] uppercase tracking-wider">Line Total</span>
                          <span className="font-bold text-primary text-base">₹{calculateItemPrice(item).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500 mx-auto max-w-[200px]">
                      No items added yet. Click "Add Item" to start your order.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50 border-t space-y-4">
            {items.length > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{calculateOrderTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span className="font-medium">₹{(calculateOrderTotal() * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                  <span>Ground Total</span>
                  <span className="text-primary">₹{(calculateOrderTotal() * 1.18).toFixed(2)}</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-12 sm:h-11 flex-1 sm:flex-none order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || items.length === 0}
                className="h-12 sm:h-11 flex-1 sm:flex-none order-1 sm:order-2"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

