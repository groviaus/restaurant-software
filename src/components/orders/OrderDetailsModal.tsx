'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { OrderWithItems, OrderStatus, PaymentMethod } from '@/lib/types';
import { format } from 'date-fns';
import { getQuantityTypeLabel, getQuantityTypeMultiplier } from '@/lib/utils/quantity';
import { QrCode } from 'lucide-react';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems | null;
}

export function OrderDetailsModal({ open, onOpenChange, order }: OrderDetailsModalProps) {
  const [fullOrder, setFullOrder] = useState<OrderWithItems | null>(order);
  const [loading, setLoading] = useState(false);

  // Always fetch full order details when modal opens to ensure we have all data
  // This ensures user details and order items are always available
  useEffect(() => {
    if (open && order?.id) {
      // Always fetch fresh order details to ensure we have:
      // - User details (order creator)
      // - Order items with menu item details
      // - Table information
      setLoading(true);
      fetch(`/api/orders/${order.id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch order: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          if (data && !data.error) {
            console.log('[OrderDetailsModal] Fetched full order:', {
              id: data.id,
              hasUser: !!(data.users || data.user),
              hasItems: !!(data.order_items || data.items),
              itemsCount: (data.order_items || data.items || []).length
            });
            setFullOrder(data);
          } else {
            console.warn('[OrderDetailsModal] No data returned, using passed order');
            setFullOrder(order);
          }
        })
        .catch(err => {
          console.error('[OrderDetailsModal] Failed to fetch order details:', err);
          // Fallback to passed order if fetch fails
          setFullOrder(order);
        })
        .finally(() => setLoading(false));
    } else {
      setFullOrder(order);
    }
  }, [open, order?.id]); // Only depend on order.id, not the whole order object

  if (!fullOrder) return null;

  // Use the full order data
  const displayOrder = fullOrder;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'SERVED':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b">
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Complete information about order {displayOrder.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading order details...</p>
            </div>
          ) : (
            <>
              {/* Order Info */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Order ID</p>
                  <p className="text-xs sm:text-sm font-mono truncate bg-muted/50 p-1.5 rounded" title={displayOrder.id}>{displayOrder.id.slice(0, 8)}...</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(displayOrder.status)}>{displayOrder.status}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Order Type</p>
                  <p className="text-sm font-medium">{displayOrder.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Table</p>
                  <p className="text-sm font-medium">
                    {(displayOrder as any).tables?.name || 
                     (displayOrder as any).table?.name || 
                     (displayOrder.order_type === 'DINE_IN' ? '-' : 'N/A')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{format(new Date(displayOrder.created_at), 'dd MMM, HH:mm')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Updated</p>
                  <p className="text-sm font-medium">{format(new Date(displayOrder.updated_at), 'dd MMM, HH:mm')}</p>
                </div>
                {displayOrder.cancellation_reason && (
                  <div className="col-span-2 lg:col-span-3 bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-red-600 mb-1">Cancellation Reason</p>
                    <p className="text-sm text-red-700 font-medium">{displayOrder.cancellation_reason}</p>
                  </div>
                )}
              </div>

              {/* Staff Info */}
              <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Staff Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Handled By</p>
                    <p className="text-sm font-semibold">{(displayOrder as any).users?.name || (displayOrder as any).user?.name || 'Unknown Staff'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Email</p>
                    <p className="text-sm truncate">{(displayOrder as any).users?.email || (displayOrder as any).user?.email || '-'}</p>
                  </div>
                </div>
              </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Items Ordered</h3>
            <div className="border rounded-xl divide-y bg-white overflow-hidden shadow-sm">
              {(() => {
                // Handle both 'items' and 'order_items' from API response
                const orderItems = (displayOrder as any).order_items || (displayOrder as any).items || [];
                console.log('[OrderDetailsModal] Order items:', orderItems);
                return orderItems.length > 0 ? (
                  orderItems.map((item: any) => {
                    const itemPrice = Number(item.price || 0);
                    const quantity = Number(item.quantity || 0);
                    const total = itemPrice * quantity;
                    const itemName = item.item?.name || item.items?.name || item.item_name || 'Menu Item';
                    return (
                      <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{itemName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.quantity_type ? getQuantityTypeLabel(item.quantity_type) : `${quantity} unit(s)`} @ ₹{itemPrice.toFixed(2)}
                            </p>
                            {item.notes && (
                              <div className="mt-2 bg-yellow-50 text-[10px] sm:text-xs p-1.5 px-2 rounded border border-yellow-100 inline-block text-yellow-700 italic">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm sm:text-base font-bold text-primary">₹{total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">
                    No items found in this order.
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 space-y-3 border border-primary/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary/60">Final Summary</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-semibold">₹{Number(displayOrder.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Service Tax & GST</span>
                <span className="font-semibold">₹{Number(displayOrder.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg sm:text-xl font-black border-t border-primary/20 pt-3 mt-1">
                <span className="text-primary">Amount to be Paid</span>
                <span className="text-primary">₹{Number(displayOrder.total).toFixed(2)}</span>
              </div>
              {displayOrder.payment_method && (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted-foreground">Paid via</span>
                  <Badge variant="outline" className="font-bold flex items-center gap-1.5 bg-white border-primary/20 text-primary px-2 py-0.5">
                    {displayOrder.payment_method === PaymentMethod.UPI ? (
                      <QrCode className="h-3 w-3" />
                    ) : null}
                    {displayOrder.payment_method}
                  </Badge>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

