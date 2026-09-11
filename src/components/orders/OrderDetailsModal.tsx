'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderWithItems, OrderStatus, PaymentMethod, QuantityType } from '@/lib/types';
import { format } from 'date-fns';
import { getQuantityTypeLabel } from '@/lib/utils/quantity';
import { QrCode, Clock, Utensils, ShoppingBag, User, CheckCircle2, Flame, Bell, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItemDetail {
  id?: string;
  item_id?: string;
  quantity: number;
  quantity_type?: string | null;
  price: number;
  notes?: string | null;
  item?: { name: string };
  items?: { name: string };
  item_name?: string;
}

interface FullOrderRecord extends Omit<OrderWithItems, 'items' | 'table' | 'user'> {
  tables?: { name: string } | null;
  table?: { name: string } | null;
  users?: { name: string; email: string } | null;
  user?: { name: string; email: string } | null;
  order_items?: OrderItemDetail[];
  items?: OrderItemDetail[];
}

export interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: (OrderWithItems | { id: string }) | null;
}

export function OrderDetailsModal({ open, onOpenChange, order }: OrderDetailsModalProps) {
  const [fetchedOrder, setFetchedOrder] = useState<FullOrderRecord | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy, HH:mm');
  };

  // Always fetch fresh order details when modal opens
  useEffect(() => {
    let ignore = false;

    if (open && order?.id) {
      fetch(`/api/orders/${order.id}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch order: ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          if (!ignore && data && !data.error) {
            setFetchedOrder(data);
          }
        })
        .catch((err) => {
          console.error('[OrderDetailsModal] Failed to fetch order details:', err);
        })
        .finally(() => {
          if (!ignore) {
            setLoading(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [open, order?.id]);

  const displayOrder = (fetchedOrder && fetchedOrder.id === order?.id ? fetchedOrder : order) as FullOrderRecord | null;

  if (!displayOrder) return null;

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case OrderStatus.PREPARING:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case OrderStatus.READY:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case OrderStatus.SERVED:
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case OrderStatus.COMPLETED:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      case OrderStatus.CANCELLED:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border/60';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return <Sparkles className="h-3 w-3 text-sky-500" />;
      case OrderStatus.PREPARING:
        return <Flame className="h-3 w-3 text-amber-500" />;
      case OrderStatus.READY:
        return <Bell className="h-3 w-3 text-emerald-500" />;
      case OrderStatus.SERVED:
        return <CheckCircle2 className="h-3 w-3 text-violet-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none max-h-none rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[92vw] sm:max-w-[640px] md:max-w-[760px] lg:max-w-[840px] sm:h-auto sm:max-h-[88vh] sm:rounded-2xl sm:border border-border/60 bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
              Order #{displayOrder.id.slice(0, 8)}
            </DialogTitle>
            <Badge className={cn('flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 border shadow-2xs', getStatusBadgeStyle(displayOrder.status))}>
              {getStatusIcon(displayOrder.status)}
              <span>{displayOrder.status}</span>
            </Badge>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(displayOrder.created_at)}</span>
            </span>
          </div>

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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs sm:text-sm text-muted-foreground animate-pulse">Loading live order details...</p>
            </div>
          ) : (
            <>
              {/* Order Metadata Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-border/50 bg-card/60 p-2.5 space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Order Type</p>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {displayOrder.order_type === 'DINE_IN' ? (
                      <>
                        <Utensils className="h-3.5 w-3.5 text-primary" />
                        <span>Dine-In</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        <span>Takeaway</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-card/60 p-2.5 space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Table</p>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {displayOrder.tables?.name ||
                      displayOrder.table?.name ||
                      (displayOrder.order_type === 'DINE_IN' ? 'Unassigned' : 'N/A')}
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-card/60 p-2.5 space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Staff Member</p>
                  <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{displayOrder.users?.name || displayOrder.user?.name || 'Staff'}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-card/60 p-2.5 space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Updated At</p>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {format(new Date(displayOrder.updated_at || displayOrder.created_at), 'HH:mm:ss')}
                  </p>
                </div>
              </div>

              {/* Cancellation Banner if applicable */}
              {displayOrder.cancellation_reason && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 space-y-1 text-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">
                    Cancellation Reason
                  </p>
                  <p className="font-medium text-rose-700 dark:text-rose-300">
                    {displayOrder.cancellation_reason}
                  </p>
                </div>
              )}

              {/* Itemized Order List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Itemized Receipt
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {(displayOrder.order_items || displayOrder.items || []).length} items
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 divide-y divide-border/50 bg-card/50 overflow-hidden shadow-2xs">
                  {(() => {
                    const orderItems = displayOrder.order_items || displayOrder.items || [];
                    if (orderItems.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-muted-foreground italic">
                          No items found in this order.
                        </div>
                      );
                    }

                    return orderItems.map((item: OrderItemDetail, idx: number) => {
                      const itemPrice = Number(item.price || 0);
                      const quantity = Number(item.quantity || 0);
                      const total = itemPrice * quantity;
                      const itemName = item.item?.name || item.items?.name || item.item_name || 'Menu Item';

                      return (
                        <div key={item.id || idx} className="p-3 hover:bg-muted/40 transition-colors">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                {itemName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                <span className="font-bold text-primary font-mono">{quantity}x</span>
                                <span>{item.quantity_type ? getQuantityTypeLabel(item.quantity_type as QuantityType) : 'unit'}</span>
                                <span>@</span>
                                <span className="font-mono">₹{itemPrice.toFixed(2)}</span>
                              </div>
                              {item.notes && (
                                <div className="mt-1.5 inline-block text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 italic">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-mono text-xs sm:text-sm font-bold text-foreground">
                                ₹{total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Order Financial Summary Box */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{(Number(displayOrder.subtotal) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Tax & GST</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{(Number(displayOrder.tax) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-base sm:text-lg font-bold border-t border-border/60 pt-2 text-foreground">
                  <span>Grand Total</span>
                  <span className="font-mono text-primary font-black">
                    ₹{(Number(displayOrder.total) || 0).toFixed(2)}
                  </span>
                </div>

                {displayOrder.payment_method && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground font-medium">Payment Mode</span>
                    <Badge variant="outline" className="font-bold flex items-center gap-1.5 bg-card text-foreground px-2 py-0.5">
                      {displayOrder.payment_method === PaymentMethod.UPI && <QrCode className="h-3 w-3" />}
                      <span>{displayOrder.payment_method}</span>
                    </Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
