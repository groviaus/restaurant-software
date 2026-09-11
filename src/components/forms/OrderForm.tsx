'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MenuItem, Table, QuantityType, PricingMode, Category } from '@/lib/types';
import { toast } from 'sonner';
import {
  Plus,
  Minus,
  X,
  Flame,
  Search,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSettings } from '@/hooks/useSettings';
import { useCreateOrderMutation, useUpdateOrderItemsMutation } from '@/hooks/mutations/useOrderMutations';
import { cn } from '@/lib/utils';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  tables: Table[];
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: any;
  initialTableId?: string;
}

interface OrderItem {
  item_id: string;
  quantity: number;
  quantity_type?: QuantityType;
  notes?: string;
  order_item_id?: string;
}

interface TopSellingItem {
  item_id: string;
  item_name: string;
  total_quantity: number;
}

interface ExistingOrderItemRecord {
  id: string;
  item_id: string;
  item?: { name: string; price?: number };
  items?: { name: string; price?: number };
  item_name?: string;
  quantity: number;
  quantity_type?: QuantityType;
  notes?: string | null;
  price?: number;
}

export function OrderForm({
  open,
  onOpenChange,
  outletId,
  tables,
  onSuccess,
  order: existingOrder,
  initialTableId,
}: OrderFormProps) {
  const { tables: storeTables } = useTableOrderStore();
  const { settings, calculateTax } = useSettings();
  const createOrderMutation = useCreateOrderMutation();
  const updateOrderItemsMutation = useUpdateOrderItemsMutation();

  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableId, setTableId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [existingOrderItems, setExistingOrderItems] = useState<ExistingOrderItemRecord[]>([]);

  // Mobile-first Tab View: 'catalog' | 'ticket'
  const [mobileTab, setMobileTab] = useState<'catalog' | 'ticket'>('catalog');

  const loading = createOrderMutation.isPending || updateOrderItemsMutation.isPending;
  const availableTables = storeTables.length > 0 ? storeTables : tables;
  const isEditMode = !!existingOrder;

  // Initialize and load data on open
  useEffect(() => {
    if (open) {
      fetchMenuItems();
      fetchCategories();
      fetchTopSellers();

      if (existingOrder?.id) {
        setLoadingOrder(true);
        const fetchFullOrder = async () => {
          try {
            const response = await fetch(`/api/orders/${existingOrder.id}`);
            if (response.ok) {
              const fullOrder = await response.json();
              setOrderType(fullOrder.order_type);
              setTableId(fullOrder.table_id || '');

              const rawItems: ExistingOrderItemRecord[] = fullOrder.order_items || fullOrder.items || [];
              const orderItems: OrderItem[] = rawItems.map((oi) => ({
                item_id: oi.item_id,
                quantity: oi.quantity,
                quantity_type: oi.quantity_type,
                notes: oi.notes || '',
                order_item_id: oi.id,
              }));
              setItems(orderItems);
              setExistingOrderItems(rawItems);
            } else {
              setOrderType(existingOrder.order_type);
              setTableId(existingOrder.table_id || '');
              const rawItems: ExistingOrderItemRecord[] = existingOrder.order_items || existingOrder.items || [];
              const orderItems: OrderItem[] = rawItems.map((oi) => ({
                item_id: oi.item_id,
                quantity: oi.quantity,
                quantity_type: oi.quantity_type,
                notes: oi.notes || '',
                order_item_id: oi.id,
              }));
              setItems(orderItems);
              setExistingOrderItems(rawItems);
            }
          } catch {
            setOrderType(existingOrder.order_type);
            setTableId(existingOrder.table_id || '');
            const rawItems: ExistingOrderItemRecord[] = existingOrder.order_items || existingOrder.items || [];
            const orderItems: OrderItem[] = rawItems.map((oi) => ({
              item_id: oi.item_id,
              quantity: oi.quantity,
              quantity_type: oi.quantity_type,
              notes: oi.notes || '',
              order_item_id: oi.id,
            }));
            setItems(orderItems);
            setExistingOrderItems(rawItems);
          } finally {
            setLoadingOrder(false);
          }
        };
        fetchFullOrder();
        setMobileTab('ticket');
      } else {
        setItems([]);
        setTableId(initialTableId || '');
        setOrderType('DINE_IN');
        setExistingOrderItems([]);
        setMobileTab('catalog');
      }
      setSelectedCategory(null);
      setSearchQuery('');
    } else {
      setItems([]);
      setTableId('');
      setOrderType('DINE_IN');
      setExistingOrderItems([]);
      setSelectedCategory(null);
      setSearchQuery('');
      setMobileTab('catalog');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, outletId, existingOrder?.id]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems((data.items || []).filter((item: MenuItem) => item.available));
      }
    } catch {
      // ignore
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchTopSellers = async () => {
    try {
      const response = await fetch('/api/analytics/top-items?days=30&limit=8');
      if (response.ok) {
        const data = await response.json();
        setTopSellers(data.items || []);
      }
    } catch {
      // ignore
    }
  };

  // Filter menu items by category AND search query
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const getMenuItem = (itemId: string): MenuItem | undefined => {
    return menuItems.find((m) => m.id === itemId);
  };

  const getItemCount = (itemId: string): number => {
    const item = items.find((i) => i.item_id === itemId);
    return item?.quantity || 0;
  };

  const quickAddItem = (menuItem: MenuItem) => {
    const existingIndex = items.findIndex((i) => i.item_id === menuItem.id);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          item_id: menuItem.id,
          quantity: 1,
          quantity_type: menuItem.requires_quantity
            ? menuItem.available_quantity_types?.[0] || QuantityType.FULL
            : undefined,
          notes: '',
        },
      ]);
    }
  };

  const addItem = () => {
    setItems([...items, { item_id: '', quantity: 1, quantity_type: QuantityType.FULL, notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Price calculation
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

  const calculateOrderSubtotal = (): number => {
    return items.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const subtotal = calculateOrderSubtotal();
  const taxInfo = calculateTax(subtotal);
  const grandTotal = subtotal + taxInfo.total;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    if (orderType === 'DINE_IN' && !tableId) {
      toast.error('Please select a table for dine-in orders');
      return;
    }

    const invalidItems = items.some((item) => !item.item_id || item.quantity <= 0);
    if (invalidItems) {
      toast.error('Please ensure all items have a valid selection and quantity');
      return;
    }

    if (isEditMode && existingOrder) {
      const existingItemsById = new Map(existingOrderItems.map((oi) => [oi.id, oi]));
      const currentItemsWithId = items.filter((item) => item.order_item_id);

      const currentItemIds = new Set(currentItemsWithId.map((item) => item.order_item_id).filter(Boolean));
      const itemsToRemove = existingOrderItems
        .filter((oi) => !currentItemIds.has(oi.id))
        .map((oi) => oi.id);

      const itemsToAdd = items.filter((item) => !item.order_item_id);

      const itemsToUpdate = currentItemsWithId
        .map((item) => {
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

      if (itemsToRemove.length === 0 && itemsToAdd.length === 0 && itemsToUpdate.length === 0) {
        toast.info('No changes detected');
        return;
      }

      onSuccess();
      onOpenChange(false);
      updateOrderItemsMutation.mutate(
        {
          orderId: existingOrder.id,
          items_to_remove: itemsToRemove.length > 0 ? itemsToRemove : undefined,
          items_to_add:
            itemsToAdd.length > 0
              ? itemsToAdd.map((item) => ({
                  item_id: item.item_id,
                  quantity: item.quantity,
                  ...(item.quantity_type && { quantity_type: item.quantity_type }),
                  ...(item.notes && { notes: item.notes }),
                }))
              : undefined,
          items_to_update:
            itemsToUpdate.length > 0
              ? itemsToUpdate.map((update) => ({
                  order_item_id: update.order_item_id,
                  quantity: update.quantity,
                  notes: update.notes,
                }))
              : undefined,
        },
        {
          onError: (err: Error) => toast.error(err.message || 'Failed to update order'),
        }
      );
    } else {
      onSuccess();
      onOpenChange(false);
      createOrderMutation.mutate(
        {
          outlet_id: outletId,
          table_id: orderType === 'DINE_IN' ? tableId : undefined,
          order_type: orderType,
          items: items.map((item) => ({
            item_id: item.item_id,
            quantity: item.quantity,
            quantity_type: item.quantity_type,
            notes: item.notes || undefined,
          })),
        },
        {
          onError: (err: Error) => toast.error(err.message || 'Failed to create order'),
        }
      );
    }
  };

  const validItemsCount = items.filter((i) => i.item_id).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none max-h-none rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[96vw] sm:max-w-[1080px] lg:max-w-[1240px] xl:max-w-[1340px] sm:h-[96vh] sm:max-h-[96vh] sm:rounded-2xl sm:border border-border/60 bg-background sm:bg-card/98 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Compact, Lean Mobile-First Header: No Icons, No Long Subheadings */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
              {isEditMode ? `Edit #${existingOrder?.id?.slice(0, 6)}` : 'New Order'}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Dine-In / Takeaway Toggle (lean text pills) */}
            <div className="flex items-center rounded-lg border border-border/60 bg-background/90 p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (!isEditMode) setOrderType('DINE_IN');
                }}
                disabled={isEditMode}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  orderType === 'DINE_IN'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Dine-In
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isEditMode) {
                    setOrderType('TAKEAWAY');
                    setTableId('');
                  }
                }}
                disabled={isEditMode}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  orderType === 'TAKEAWAY'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Takeaway
              </button>
            </div>

            {/* Table Dropdown (Dine-in only) */}
            {orderType === 'DINE_IN' && (
              <Select
                value={tableId}
                onValueChange={(val) => {
                  if (!isEditMode) setTableId(val);
                }}
                disabled={isEditMode}
              >
                <SelectTrigger className="h-8 text-xs min-w-[90px] sm:min-w-[120px] rounded-lg border-border/60 bg-background/90 font-medium shadow-2xs">
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 bg-popover/95 backdrop-blur-md max-h-56">
                  {availableTables
                    .filter((t) => isEditMode || t.status === 'EMPTY' || t.status === 'BILLED')
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name} {t.capacity ? `(${t.capacity})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {/* Dedicated Mobile-Aligned Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile View Switcher (Dishes Catalog vs Ticket) */}
        <div className="lg:hidden flex border-b border-border/60 bg-muted/20 text-xs font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={cn(
              'flex-1 py-2 text-center border-b-2 transition-all cursor-pointer',
              mobileTab === 'catalog'
                ? 'border-primary text-primary font-bold bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Menu Items ({filteredMenuItems.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('ticket')}
            className={cn(
              'flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              mobileTab === 'ticket'
                ? 'border-primary text-primary font-bold bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Ticket</span>
            {validItemsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold">
                {validItemsCount}
              </span>
            )}
            {validItemsCount > 0 && (
              <span className="font-mono text-foreground font-bold text-[11px]">
                ₹{grandTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>

        {/* Main Terminal Area */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {loadingOrder ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">Loading order...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
              {/* Left Column (Menu Catalog) - On mobile, visible when mobileTab === 'catalog' */}
              <div
                className={cn(
                  'lg:col-span-7 flex flex-col border-r border-border/60 overflow-hidden bg-card/40',
                  mobileTab !== 'catalog' && 'hidden lg:flex'
                )}
              >
                {/* Search & Categories */}
                <div className="p-3 sm:p-4 border-b border-border/60 space-y-2.5 bg-background/80 flex-shrink-0">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search menu dishes..."
                      className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/60 bg-background font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Top Sellers (if not searching) */}
                  {topSellers.length > 0 && !searchQuery && (
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-1.5 pb-0.5">
                        {topSellers.map((ts) => {
                          const mi = menuItems.find((m) => m.id === ts.item_id);
                          if (!mi) return null;
                          const count = getItemCount(mi.id);
                          return (
                            <button
                              key={ts.item_id}
                              type="button"
                              onClick={() => quickAddItem(mi)}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                                count > 0
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                  : 'bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                            >
                              <Flame className="h-3 w-3 text-amber-500" />
                              <span className="truncate max-w-[100px]">{mi.name}</span>
                              <span className="font-mono text-[11px] opacity-80">₹{mi.price.toFixed(0)}</span>
                              {count > 0 && (
                                <span className="px-1 rounded bg-white/30 text-[10px] font-bold">
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}

                  {/* Category Pills */}
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-1.5 pb-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                          selectedCategory === null
                            ? 'bg-foreground text-background border-foreground shadow-2xs'
                            : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/80'
                        )}
                      >
                        All ({menuItems.length})
                      </button>
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                              isSelected
                                ? 'bg-foreground text-background border-foreground shadow-2xs'
                                : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/80'
                            )}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Menu Catalog Grid: High-density, mobile-first */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
                  {filteredMenuItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs space-y-1">
                      <p className="font-bold text-foreground">No dishes found</p>
                      <p>Try a different search term or category</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pb-16 lg:pb-0">
                      {filteredMenuItems.map((menuItem) => {
                        const count = getItemCount(menuItem.id);
                        return (
                          <div
                            key={menuItem.id}
                            onClick={() => quickAddItem(menuItem)}
                            className={cn(
                              'group relative flex flex-col justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 min-h-[95px] active:scale-98',
                              count > 0
                                ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20 shadow-2xs'
                                : 'bg-card hover:bg-muted/40 border-border/60 hover:border-border'
                            )}
                          >
                            {/* In-cart count badge */}
                            {count > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-2xs animate-in zoom-in-50">
                                {count}
                              </span>
                            )}

                            <div>
                              <p className="font-bold text-xs text-foreground line-clamp-2 leading-snug">
                                {menuItem.name}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/50">
                              <span className="font-mono text-xs font-black text-foreground">
                                {settings.currency_symbol}{menuItem.price.toFixed(0)}
                              </span>
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                                <Plus className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mobile Bottom Sticky Cart Strip (When items added) */}
                {validItemsCount > 0 && (
                  <div className="lg:hidden p-3 border-t border-border/60 bg-background/95 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg flex-shrink-0">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        {validItemsCount} {validItemsCount === 1 ? 'dish' : 'dishes'} selected
                      </span>
                      <p className="font-mono text-base font-black text-foreground">
                        {settings.currency_symbol}{grandTotal.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setMobileTab('ticket')}
                      className="h-9 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Ticket</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column (Ticket Items & Stepper) - On mobile, visible when mobileTab === 'ticket' */}
              <div
                className={cn(
                  'lg:col-span-5 flex flex-col overflow-hidden bg-background',
                  mobileTab !== 'ticket' && 'hidden lg:flex'
                )}
              >
                {/* Ticket Ribbon */}
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-border/60 bg-muted/40 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Ticket Items</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-muted text-foreground text-[11px] font-mono font-bold border border-border/60">
                      {validItemsCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Custom</span>
                    </button>
                    {/* On mobile, quick button to go back to catalog */}
                    <button
                      type="button"
                      onClick={() => setMobileTab('catalog')}
                      className="lg:hidden text-xs text-muted-foreground hover:text-foreground font-medium"
                    >
                      + Add dishes
                    </button>
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-xs font-bold text-foreground">Ticket is empty</p>
                      <p className="text-[11px] text-muted-foreground max-w-xs">
                        Pick dishes from the catalog to build this order ticket.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMobileTab('catalog')}
                        className="mt-2 text-xs rounded-xl h-8"
                      >
                        Browse Menu Catalog
                      </Button>
                    </div>
                  ) : (
                    items.map((item, index) => {
                      const menuItem = getMenuItem(item.item_id);
                      const requiresQuantity = menuItem?.requires_quantity || false;
                      const availableTypes = menuItem?.available_quantity_types || [
                        QuantityType.QUARTER,
                        QuantityType.HALF,
                        QuantityType.THREE_QUARTER,
                        QuantityType.FULL,
                      ];

                      // Fallback manual selector if item not yet selected
                      if (!item.item_id) {
                        return (
                          <div key={index} className="p-2.5 rounded-xl border border-border/60 bg-card flex items-center gap-2 shadow-2xs">
                            <div className="flex-1">
                              <Select
                                value=""
                                onValueChange={(value) => {
                                  const sel = getMenuItem(value);
                                  updateItem(index, 'item_id', value);
                                  if (sel?.requires_quantity) {
                                    updateItem(index, 'quantity_type', sel.available_quantity_types?.[0] || QuantityType.FULL);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs rounded-lg">
                                  <SelectValue placeholder="Select dish..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                  {menuItems.map((mi) => (
                                    <SelectItem key={mi.id} value={mi.id} className="text-xs">
                                      {mi.name} ({settings.currency_symbol}{mi.price})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      }

                      const linePrice = calculateItemPrice(item);

                      return (
                        <div
                          key={index}
                          className="p-3 rounded-xl border border-border/60 bg-card/90 shadow-2xs space-y-2 hover:border-border transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">
                                {menuItem?.name || 'Dish'}
                              </p>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {settings.currency_symbol}{menuItem ? menuItem.price.toFixed(0) : 0} each
                              </span>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-background shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    removeItem(index);
                                  } else {
                                    updateItem(index, 'quantity', item.quantity - 1);
                                  }
                                }}
                                className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-5 text-center font-mono text-xs font-bold text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="font-mono text-xs font-black text-foreground min-w-[55px] text-right">
                              {settings.currency_symbol}{linePrice.toFixed(0)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Portion selection */}
                          {requiresQuantity && (
                            <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                              {[
                                { label: 'Quarter', val: QuantityType.QUARTER },
                                { label: 'Half', val: QuantityType.HALF },
                                { label: '3/4', val: QuantityType.THREE_QUARTER },
                                { label: 'Full', val: QuantityType.FULL },
                              ]
                                .filter((opt) => availableTypes.includes(opt.val))
                                .map((opt) => (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => updateItem(index, 'quantity_type', opt.val)}
                                    className={cn(
                                      'px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border',
                                      item.quantity_type === opt.val
                                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                                        : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground'
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* Kitchen note field */}
                          <div>
                            <Input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateItem(index, 'notes', e.target.value)}
                              placeholder="Special note (e.g. less spicy)..."
                              className="h-7 text-[11px] rounded-lg border-border/50 bg-background/60 placeholder:text-muted-foreground/60"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/40 space-y-3 flex-shrink-0">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground text-[11px]">
                      <span>Items Subtotal</span>
                      <span className="font-mono font-medium text-foreground">
                        {settings.currency_symbol}{subtotal.toFixed(2)}
                      </span>
                    </div>

                    {settings.gst_enabled && (
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>GST Tax ({((settings.cgst_percentage || 0) + (settings.sgst_percentage || 0)) || settings.gst_percentage}%)</span>
                        <span className="font-mono font-medium text-foreground">
                          {settings.currency_symbol}{taxInfo.total.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-1.5 border-t border-border/60">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Grand Total
                      </span>
                      <span className="font-mono text-lg font-black text-primary">
                        {settings.currency_symbol}{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                      className="h-9 flex-1 text-xs font-medium rounded-xl border-border/60 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="h-9 flex-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        'Processing...'
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>
                            {isEditMode
                              ? `Save (${validItemsCount})`
                              : `Place Order (${validItemsCount})`}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
