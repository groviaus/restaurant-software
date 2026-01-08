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
import { MenuItem, Table, QuantityType, PricingMode, Category } from '@/lib/types';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const availableTables = storeTables.length > 0 ? storeTables : tables;

  useEffect(() => {
    if (open) {
      fetchMenuItems();
      fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Group menu items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const categoryName = item.category || 'Other';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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

  // Get menu item details
  const getMenuItem = (itemId: string): MenuItem | undefined => {
    return menuItems.find(m => m.id === itemId);
  };

  // Calculate price for a specific item based on its pricing mode
  const calculateItemPrice = (item: OrderItem): number => {
    const menuItem = getMenuItem(item.item_id);
    if (!menuItem) return 0;

    let unitPrice = 0;

    // Calculate unit price based on pricing mode
    if (menuItem.pricing_mode === PricingMode.FIXED) {
      // Fixed price - no quantity type
      unitPrice = menuItem.price;
    } else if (menuItem.pricing_mode === PricingMode.QUANTITY_AUTO) {
      // Auto-calculated pricing
      const basePrice = menuItem.base_price || menuItem.price;
      switch (item.quantity_type) {
        case QuantityType.QUARTER:
          unitPrice = basePrice * 0.25;
          break;
        case QuantityType.HALF:
          unitPrice = basePrice * 0.5;
          break;
        case QuantityType.THREE_QUARTER:
          unitPrice = basePrice * 0.75;
          break;
        case QuantityType.FULL:
        default:
          unitPrice = basePrice;
          break;
      }
    } else if (menuItem.pricing_mode === PricingMode.QUANTITY_MANUAL) {
      // Manual pricing for each quantity
      switch (item.quantity_type) {
        case QuantityType.QUARTER:
          unitPrice = menuItem.quarter_price ?? 0;
          break;
        case QuantityType.HALF:
          unitPrice = menuItem.half_price ?? 0;
          break;
        case QuantityType.THREE_QUARTER:
          unitPrice = menuItem.three_quarter_price ?? 0;
          break;
        case QuantityType.FULL:
        default:
          unitPrice = menuItem.full_price ?? menuItem.price;
          break;
      }
    }

    return unitPrice * item.quantity;
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
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b">
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Add items to create a new order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="table">Table</Label>
                  <Select value={tableId} onValueChange={setTableId} required={orderType === 'DINE_IN'}>
                    <SelectTrigger>
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

            <div className="space-y-4">
              <div className="flex justify-between items-center sticky top-0 bg-white py-1 z-10 border-b border-dashed">
                <Label className="text-base font-semibold">Order Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const menuItem = getMenuItem(item.item_id);
                  const requiresQuantity = menuItem?.requires_quantity || false;

                  return (
                    <div key={index} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm relative">
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3 pr-8">
                        {/* Item Selection with Category Grouping */}
                        <div className="space-y-2">
                          <Label>Item</Label>
                          <Select
                            value={item.item_id}
                            onValueChange={(value) => {
                              const selectedMenuItem = getMenuItem(value);
                              const updated = [...items];
                              updated[index] = {
                                ...updated[index],
                                item_id: value,
                                quantity_type: selectedMenuItem?.requires_quantity
                                  ? (selectedMenuItem.available_quantity_types?.[0] || QuantityType.FULL)
                                  : undefined,
                              };
                              setItems(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
                                <div key={categoryName}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                    {categoryName}
                                  </div>
                                  {categoryItems.map((menuItem) => (
                                    <SelectItem key={menuItem.id} value={menuItem.id}>
                                      {menuItem.name} (₹{menuItem.price.toFixed(2)})
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Quantity Type Selection - Only show if item requires quantity */}
                          {requiresQuantity && (
                            <div className="space-y-2">
                              <Label>Portion</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                {[
                                  { label: 'Quarter', val: QuantityType.QUARTER },
                                  { label: 'Half', val: QuantityType.HALF },
                                  { label: 'Three Quarter', val: QuantityType.THREE_QUARTER },
                                  { label: 'Full', val: QuantityType.FULL }
                                ].filter(opt => !menuItem?.available_quantity_types || menuItem.available_quantity_types.includes(opt.val))
                                  .map((opt) => (
                                    <Button
                                      key={opt.val}
                                      type="button"
                                      size="sm"
                                      variant={item.quantity_type === opt.val ? 'default' : 'outline'}
                                      onClick={() => updateItem(index, 'quantity_type', opt.val)}
                                      className="text-[10px] sm:text-xs h-9 px-1"
                                    >
                                      {opt.label}
                                    </Button>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Quantity */}
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                className="h-10 w-10"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="h-10 text-center font-semibold w-16"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                className="h-10 w-10"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <Label>Special Instructions (Optional)</Label>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            placeholder="e.g. Extra spicy, less oil"
                          />
                        </div>
                      </div>

                      {/* Price Display */}
                      {item.item_id && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between items-center border border-dashed">
                          <div className="text-gray-600">
                            <span className="font-medium">
                              {menuItem?.pricing_mode === PricingMode.FIXED
                                ? `₹${menuItem.price.toFixed(2)} (Fixed)`
                                : requiresQuantity && item.quantity_type
                                  ? (
                                    {
                                      [QuantityType.QUARTER]: 'Quarter',
                                      [QuantityType.HALF]: 'Half',
                                      [QuantityType.THREE_QUARTER]: 'Three Quarter',
                                      [QuantityType.FULL]: 'Full',
                                      [QuantityType.CUSTOM]: 'Custom',
                                    } as Record<string, string>
                                  )[item.quantity_type] || item.quantity_type.toLowerCase().replace('_', ' ')
                                  : 'Price'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400 block text-xs uppercase">Line Total</span>
                            <span className="font-bold text-primary text-lg">
                              ₹{calculateItemPrice(item).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500">
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
                  <span>Grand Total</span>
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
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || items.length === 0}
                className="flex-1 sm:flex-none"
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
