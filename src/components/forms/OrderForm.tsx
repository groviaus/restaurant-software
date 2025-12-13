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
import { TableForm } from './TableForm';

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
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableId, setTableId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [tableFormOpen, setTableFormOpen] = useState(false);
  const [tablesList, setTablesList] = useState<Table[]>(tables);

  useEffect(() => {
    if (open) {
      fetchMenuItems();
      setItems([]);
      setTableId('');
      setOrderType('DINE_IN');
      setTablesList(tables);
      console.log('OrderForm: Tables received:', tables);
      console.log('OrderForm: Available tables (EMPTY or BILLED):', 
        tables.filter((table) => table.status === 'EMPTY' || table.status === 'BILLED'));
    }
  }, [open, outletId, tables]);

  const fetchMenuItems = async () => {
    if (!outletId) {
      console.error('No outlet ID provided');
      toast.error('Outlet ID is missing. Please refresh the page.');
      return;
    }
    
    setLoadingItems(true);
    try {
      console.log('Fetching menu items for outlet:', outletId);
      const response = await fetch(`/api/menu?outlet_id=${outletId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch menu items' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to fetch menu items (${response.status})`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      const fetchedItems = data.items || data || [];
      console.log('Raw fetched items:', fetchedItems);
      
      // Include items where available is true or null/undefined (default to available)
      // Also show items with available: false for debugging, but we'll filter them out
      const availableItems = fetchedItems.filter((item: MenuItem) => 
        item.available === true || item.available === null || item.available === undefined
      );
      
      console.log('Total items fetched:', fetchedItems.length);
      console.log('Available items:', availableItems.length);
      console.log('All items details:', fetchedItems.map((item: MenuItem) => ({
        id: item.id,
        name: item.name,
        available: item.available,
        outlet_id: item.outlet_id
      })));
      
      setMenuItems(availableItems);
      
      if (fetchedItems.length === 0) {
        toast.warning('No menu items found for this outlet. Please add items in Menu Management.');
      } else if (availableItems.length === 0) {
        toast.warning(`${fetchedItems.length} item(s) found but none are marked as available. Please enable items in Menu Management.`);
      }
    } catch (error: any) {
      console.error('Failed to fetch menu items:', error);
      toast.error(error.message || 'Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const addItem = () => {
    setItems([...items, { item_id: '', quantity: 1, quantity_type: QuantityType.FULL, notes: '' }]);
  };

  const handleQuantityTypeChange = (index: number, quantityType: QuantityType) => {
    // When quantity type is selected, quantity is always 1
    updateItem(index, 'quantity_type', quantityType);
    updateItem(index, 'quantity', 1);
  };

  const handleTableCreated = async () => {
    // Refresh tables list
    try {
      const response = await fetch(`/api/tables?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        const refreshedTables = data.tables || data || [];
        setTablesList(refreshedTables);
        console.log('OrderForm: Tables refreshed after creation:', refreshedTables);
        console.log('OrderForm: Available tables after refresh:', 
          refreshedTables.filter((table: Table) => table.status === 'EMPTY' || table.status === 'BILLED'));
      }
    } catch (err) {
      console.error('Failed to refresh tables:', err);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
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
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
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
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="table">Table</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTableFormOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Table
                </Button>
              </div>
              <Select value={tableId} onValueChange={setTableId} required={orderType === 'DINE_IN'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tablesList
                    .filter((table) => table.status === 'EMPTY' || table.status === 'BILLED')
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name} (Capacity: {table.capacity || 'N/A'})
                      </SelectItem>
                    ))}
                  {tablesList.filter((table) => table.status === 'EMPTY' || table.status === 'BILLED').length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No available tables. Click "Add Table" to create one.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Item</Label>
                        <Select
                          value={item.item_id || ''}
                          onValueChange={(value) => updateItem(index, 'item_id', value)}
                          disabled={loadingItems}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingItems ? "Loading..." : "Select item"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {loadingItems ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                                Loading items...
                              </div>
                            ) : menuItems.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                                No items available. Add items in Menu Management.
                              </div>
                            ) : (
                              menuItems.map((menuItem) => (
                                <SelectItem key={menuItem.id} value={menuItem.id}>
                                  {menuItem.name} - ₹{Number(menuItem.price).toFixed(2)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Quantity</Label>
                        <Select
                          value={item.quantity_type || QuantityType.FULL}
                          onValueChange={(value) => handleQuantityTypeChange(index, value as QuantityType)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={QuantityType.QUARTER}>250gm (Quarter)</SelectItem>
                            <SelectItem value={QuantityType.HALF}>500gm (Half)</SelectItem>
                            <SelectItem value={QuantityType.THREE_QUARTER}>750gm (Three Quarter)</SelectItem>
                            <SelectItem value={QuantityType.FULL}>1kg (Full)</SelectItem>
                          </SelectContent>
                        </Select>
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
                  <div className="grid gap-2">
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
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Click "Add Item" to start adding items to the order
                  </p>
                  {menuItems.length === 0 && !loadingItems && (
                    <p className="text-xs text-destructive">
                      No menu items available. Please add items to the menu first.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

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
      <TableForm
        open={tableFormOpen}
        onOpenChange={setTableFormOpen}
        outletId={outletId}
        onSuccess={handleTableCreated}
      />
    </Dialog>
  );
}

