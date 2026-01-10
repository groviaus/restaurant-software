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
import { Badge } from '@/components/ui/badge';
import { MenuItem, Table, QuantityType, PricingMode, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Minus, X, Flame, TrendingUp, ChefHat } from 'lucide-react';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSettings } from '@/hooks/useSettings';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  tables: Table[];
  onSuccess: () => void;
  order?: any; // Optional: if provided, form is in edit mode
}

interface OrderItem {
  item_id: string;
  quantity: number;
  quantity_type?: QuantityType;
  notes?: string;
  order_item_id?: string; // For edit mode: track original order_item id
}

interface TopSellingItem {
  item_id: string;
  item_name: string;
  total_quantity: number;
}

export function OrderForm({
  open,
  onOpenChange,
  outletId,
  tables,
  onSuccess,
  order: existingOrder,
}: OrderFormProps) {
  const { addOrder, tables: storeTables, updateOrder } = useTableOrderStore();
  const { settings, calculateTax } = useSettings();
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableId, setTableId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false); // Loading state for fetching order data
  const [existingOrderItems, setExistingOrderItems] = useState<any[]>([]); // Track original order items for edit mode

  const availableTables = storeTables.length > 0 ? storeTables : tables;
  const isEditMode = !!existingOrder;

  useEffect(() => {
    if (open) {
      fetchMenuItems();
      fetchCategories();
      fetchTopSellers();
      
      if (existingOrder?.id) {
        // Edit mode: Load existing order data
        setLoadingOrder(true);
        const fetchFullOrder = async () => {
          try {
            const response = await fetch(`/api/orders/${existingOrder.id}`);
            if (response.ok) {
              const fullOrder = await response.json();
              setOrderType(fullOrder.order_type);
              setTableId(fullOrder.table_id || '');
              
              // Convert order items to form items
              const orderItems = (fullOrder.order_items || fullOrder.items || []).map((oi: any) => ({
                item_id: oi.item_id,
                quantity: oi.quantity,
                quantity_type: oi.quantity_type,
                notes: oi.notes || '',
                order_item_id: oi.id, // Track original order_item id for updates
              }));
              setItems(orderItems);
              setExistingOrderItems(fullOrder.order_items || fullOrder.items || []);
            } else {
              // Fallback to passed order
              setOrderType(existingOrder.order_type);
              setTableId(existingOrder.table_id || '');
              const orderItems = (existingOrder.order_items || existingOrder.items || []).map((oi: any) => ({
                item_id: oi.item_id,
                quantity: oi.quantity,
                quantity_type: oi.quantity_type,
                notes: oi.notes || '',
                order_item_id: oi.id, // Track original order_item id for updates
              }));
              setItems(orderItems);
              setExistingOrderItems(existingOrder.order_items || existingOrder.items || []);
            }
          } catch (error) {
            console.error('Failed to fetch full order:', error);
            // Fallback to passed order
            setOrderType(existingOrder.order_type);
            setTableId(existingOrder.table_id || '');
            const orderItems = (existingOrder.order_items || existingOrder.items || []).map((oi: any) => ({
              item_id: oi.item_id,
              quantity: oi.quantity,
              quantity_type: oi.quantity_type,
              notes: oi.notes || '',
              order_item_id: oi.id, // Track original order_item id for updates
            }));
            setItems(orderItems);
            setExistingOrderItems(existingOrder.order_items || existingOrder.items || []);
          } finally {
            setLoadingOrder(false);
          }
        };
        fetchFullOrder();
      } else {
        // Create mode: Reset form
        setItems([]);
        setTableId('');
        setOrderType('DINE_IN');
        setExistingOrderItems([]);
      }
      setSelectedCategory(null);
    } else {
      // Reset when modal closes
      setItems([]);
      setTableId('');
      setOrderType('DINE_IN');
      setExistingOrderItems([]);
      setSelectedCategory(null);
    }
  }, [open, outletId, existingOrder?.id]);

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

  const fetchTopSellers = async () => {
    try {
      const response = await fetch(`/api/analytics/top-items?days=30&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setTopSellers(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch top sellers:', error);
    }
  };

  // Filter menu items by selected category
  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory || item.category === selectedCategory)
    : menuItems;

  // Get menu item details
  const getMenuItem = (itemId: string): MenuItem | undefined => {
    return menuItems.find(m => m.id === itemId);
  };

  // Quick add item function
  const quickAddItem = (menuItem: MenuItem) => {
    // Check if item already exists in order
    const existingIndex = items.findIndex(i => i.item_id === menuItem.id);

    if (existingIndex >= 0) {
      // Increment quantity
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
      toast.success(`Added another ${menuItem.name}`);
    } else {
      // Add new item
      setItems([...items, {
        item_id: menuItem.id,
        quantity: 1,
        quantity_type: menuItem.requires_quantity
          ? (menuItem.available_quantity_types?.[0] || QuantityType.FULL)
          : undefined,
        notes: '',
      }]);
      toast.success(`Added ${menuItem.name}`);
    }
  };

  // Get item count in current order
  const getItemCount = (itemId: string): number => {
    const item = items.find(i => i.item_id === itemId);
    return item?.quantity || 0;
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

  // Calculate price for a specific item based on its pricing mode
  const calculateItemPrice = (item: OrderItem): number => {
    const menuItem = getMenuItem(item.item_id);
    if (!menuItem) return 0;

    let unitPrice = 0;

    if (menuItem.pricing_mode === PricingMode.FIXED) {
      unitPrice = menuItem.price;
    } else if (menuItem.pricing_mode === PricingMode.QUANTITY_AUTO) {
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
      if (isEditMode && existingOrder) {
        // Edit mode: Update existing order
        // Track items by their order_item_id for proper updates
        const existingItemsById = new Map(
          existingOrderItems.map((oi: any) => [oi.id, oi])
        );
        const currentItemsWithId = items.filter(item => item.order_item_id);

        // Find items to remove (exist in original but not in current items with IDs)
        const currentItemIds = new Set(currentItemsWithId.map(item => item.order_item_id).filter(Boolean));
        const itemsToRemove = existingOrderItems
          .filter((oi: any) => !currentItemIds.has(oi.id))
          .map((oi: any) => oi.id);

        // Find items to add (items without order_item_id are new)
        const itemsToAdd = items.filter(item => !item.order_item_id);

        // Find items to update (items with order_item_id that have changes)
        const itemsToUpdate = currentItemsWithId
          .map(item => {
            if (!item.order_item_id) return null;
            const existing = existingItemsById.get(item.order_item_id);
            if (!existing) return null;

            const hasChanges = 
              existing.quantity !== item.quantity ||
              (existing.notes || '') !== (item.notes || '');

            if (!hasChanges) return null;

            return {
              order_item_id: item.order_item_id,
              quantity: item.quantity,
              notes: item.notes || null,
            };
          })
          .filter((update): update is { order_item_id: string; quantity: number; notes: string | null } => update !== null);

        // Prepare payload
        const payload: any = {};
        if (itemsToRemove.length > 0) {
          payload.items_to_remove = itemsToRemove;
        }
        if (itemsToAdd.length > 0) {
          payload.items_to_add = itemsToAdd.map(item => ({
            item_id: item.item_id,
            quantity: item.quantity,
            ...(item.quantity_type && { quantity_type: item.quantity_type }),
            ...(item.notes && { notes: item.notes }),
          }));
        }
        if (itemsToUpdate.length > 0) {
          payload.items_to_update = itemsToUpdate.map(update => {
            const updateObj: any = {
              order_item_id: update.order_item_id,
            };
            // Always include quantity since we only add items with changes
            updateObj.quantity = update.quantity;
            // Notes can be null
            updateObj.notes = update.notes ?? null;
            return updateObj;
          });
        }

        // Check if there are any changes
        if (itemsToRemove.length === 0 && itemsToAdd.length === 0 && itemsToUpdate.length === 0) {
          toast.info('No changes to save');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/orders/${existingOrder.id}/items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          // Show detailed validation errors if available
          if (error.details && Array.isArray(error.details)) {
            const errorMessages = error.details.map((detail: any) => 
              `${detail.path?.join('.') || 'Field'}: ${detail.message || 'Invalid value'}`
            ).join(', ');
            throw new Error(`Validation error: ${errorMessages}`);
          }
          throw new Error(error.error || 'Failed to update order');
        }

        const updatedOrder = await response.json();
        updateOrder(updatedOrder);

        toast.success('Order updated successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        // Create mode: Create new order
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
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} order`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-[800px] max-h-[100vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 sm:pt-6 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? 'Edit Order' : 'Create New Order'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm mt-1">
            {isEditMode 
              ? `Edit items for order ${existingOrder?.id?.slice(0, 8) || ''}`
              : 'Quick select items or add manually'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {loadingOrder ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading order details...</p>
              </div>
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
            {/* Order Type & Table Selection */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_type">Order Type</Label>
                <Select
                  value={orderType}
                  onValueChange={(value) => {
                    if (!isEditMode) {
                      setOrderType(value as 'DINE_IN' | 'TAKEAWAY');
                      if (value === 'TAKEAWAY') {
                        setTableId('');
                      }
                    }
                  }}
                  disabled={isEditMode}
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
                  <Select 
                    value={tableId} 
                    onValueChange={(value) => {
                      if (!isEditMode) {
                        setTableId(value);
                      }
                    }} 
                    required={orderType === 'DINE_IN'}
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables
                        .filter((table) => isEditMode || table.status === 'EMPTY' || table.status === 'BILLED')
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

            {/* Top Sellers Section */}
            {topSellers.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <Label className="text-sm font-semibold text-orange-700">Top Sellers</Label>
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2 px-0.5">
                    {topSellers.map((topItem) => {
                      const menuItem = menuItems.find(m => m.id === topItem.item_id);
                      if (!menuItem) return null;
                      const count = getItemCount(menuItem.id);

                      return (
                        <Badge
                          key={topItem.item_id}
                          variant={count > 0 ? "default" : "outline"}
                          className={`cursor-pointer px-3 py-2 text-xs sm:text-sm whitespace-nowrap transition-all hover:scale-105 ${count > 0
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                            : 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'
                            }`}
                          onClick={() => quickAddItem(menuItem)}
                        >
                          <Flame className="h-3 w-3 mr-1" />
                          {menuItem.name}
                          {count > 0 && (
                            <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs font-bold">
                              {count}
                            </span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-semibold">Categories</Label>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2 px-0.5">
                  <Badge
                    variant={selectedCategory === null ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm transition-all ${selectedCategory === null
                      ? 'bg-primary hover:bg-primary/90'
                      : 'hover:bg-muted'
                      }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Items
                  </Badge>
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id
                        ? 'bg-primary hover:bg-primary/90'
                        : 'hover:bg-muted'
                        }`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold">
                {selectedCategory
                  ? `${categories.find(c => c.id === selectedCategory)?.name || 'Items'}`
                  : 'All Menu Items'
                } ({filteredMenuItems.length})
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredMenuItems.map((menuItem) => {
                  const count = getItemCount(menuItem.id);
                  return (
                    <div
                      key={menuItem.id}
                      onClick={() => quickAddItem(menuItem)}
                      className={`relative p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${count > 0
                        ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                    >
                      {count > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {count}
                        </div>
                      )}
                      <p className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">
                        {menuItem.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{menuItem.price.toFixed(0)}
                      </p>
                    </div>
                  );
                })}
              </div>
              {filteredMenuItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No items found in this category
                </div>
              )}
            </div>

            {/* Order Summary */}
            {items.length > 0 && (
              <div className="space-y-3 pt-4 border-t-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Order Items ({items.filter(i => i.item_id).length})</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Manual Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {items.map((item, index) => {
                    const menuItem = getMenuItem(item.item_id);
                    const requiresQuantity = menuItem?.requires_quantity || false;
                    const availableTypes = menuItem?.available_quantity_types || [QuantityType.QUARTER, QuantityType.HALF, QuantityType.THREE_QUARTER, QuantityType.FULL];

                    // Show item selector if no item selected
                    if (!item.item_id) {
                      return (
                        <div key={index} className="p-2.5 bg-gray-50 rounded-lg flex items-center gap-2">
                          <div className="flex-1">
                            <Select
                              value=""
                              onValueChange={(value) => {
                                const selectedMenuItem = getMenuItem(value);
                                updateItem(index, 'item_id', value);
                                if (selectedMenuItem?.requires_quantity) {
                                  updateItem(index, 'quantity_type', selectedMenuItem.available_quantity_types?.[0] || QuantityType.FULL);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select an item..." />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => {
                                  const categoryItems = menuItems.filter(m => m.category_id === cat.id || m.category === cat.name);
                                  if (categoryItems.length === 0) return null;
                                  return (
                                    <div key={cat.id}>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                        {cat.name}
                                      </div>
                                      {categoryItems.map((mi) => (
                                        <SelectItem key={mi.id} value={mi.id}>
                                          {mi.name} ({settings.currency_symbol}{mi.price})
                                        </SelectItem>
                                      ))}
                                    </div>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="p-2.5 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {menuItem?.name || 'Unknown item'}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeItem(index);
                                } else {
                                  updateItem(index, 'quantity', item.quantity - 1);
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <span className="text-sm font-semibold w-16 text-right">
                            {settings.currency_symbol}{calculateItemPrice(item).toFixed(0)}
                          </span>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Portion Selection for items that require quantity */}
                        {requiresQuantity && (
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: 'Quarter', val: QuantityType.QUARTER },
                              { label: 'Half', val: QuantityType.HALF },
                              { label: 'Three-Quarters', val: QuantityType.THREE_QUARTER },
                              { label: 'Full', val: QuantityType.FULL }
                            ]
                              .filter(opt => availableTypes.includes(opt.val))
                              .map((opt) => (
                                <Button
                                  key={opt.val}
                                  type="button"
                                  size="sm"
                                  variant={item.quantity_type === opt.val ? 'default' : 'outline'}
                                  onClick={() => updateItem(index, 'quantity_type', opt.val)}
                                  className="h-6 text-[10px] px-2"
                                >
                                  {opt.label}
                                </Button>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500">
                  Tap on items above to add them to the order
                </p>
              </div>
            )}

            {/* Footer with Totals */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50 border-t space-y-4">
              {items.length > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">{settings.currency_symbol}{calculateOrderTotal().toFixed(2)}</span>
                  </div>
                  {settings.gst_enabled && (
                    <>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>CGST ({settings.cgst_percentage}%)</span>
                        <span className="font-medium">{settings.currency_symbol}{calculateTax(calculateOrderTotal()).cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>SGST ({settings.sgst_percentage}%)</span>
                        <span className="font-medium">{settings.currency_symbol}{calculateTax(calculateOrderTotal()).sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-base sm:text-lg font-bold pt-2 border-t">
                    <span>Grand Total</span>
                    <span className="text-primary">
                      {settings.currency_symbol}{(calculateOrderTotal() + calculateTax(calculateOrderTotal()).total).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || loadingOrder}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || loadingOrder || items.length === 0}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  {loading 
                    ? 'Processing...' 
                    : isEditMode 
                      ? `Update Order${items.length > 0 ? ` (${items.filter(i => i.item_id).length})` : ''}`
                      : `Place Order${items.length > 0 ? ` (${items.filter(i => i.item_id).length})` : ''}`
                  }
                </Button>
              </div>
            </div>
          </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
