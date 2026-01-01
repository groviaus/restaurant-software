'use client';

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
  if (!order) return null;

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Complete information about order {order.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Order ID</p>
              <p className="text-sm font-mono">{order.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Order Type</p>
              <p className="text-sm">{order.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Table</p>
              <p className="text-sm">{(order as any).tables?.name || (order as any).table?.name || (order.order_type === 'DINE_IN' ? '-' : 'N/A')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="text-sm">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Updated At</p>
              <p className="text-sm">{format(new Date(order.updated_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            {order.cancellation_reason && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Cancellation Reason</p>
                <p className="text-sm text-red-600">{order.cancellation_reason}</p>
              </div>
            )}
          </div>

          {/* Customer/Staff Info */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Staff Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Staff Name</p>
                <p className="text-sm">{order.user?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Staff Email</p>
                <p className="text-sm">{order.user?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Order Items</h3>
            <div className="space-y-2">
              {(order.order_items || order.items) && (order.order_items || order.items).length > 0 ? (
                (order.order_items || order.items).map((item: any) => {
                  // Price is already the effective price (base_price * multiplier) stored in order_items
                  const itemPrice = Number(item.price);
                  const total = itemPrice * item.quantity;
                  return (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.items?.name || 'Item'}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-1">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {item.quantity_type ? getQuantityTypeLabel(item.quantity_type) : `${item.quantity}x`}
                          </p>
                          <p className="text-sm font-medium">₹{total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No items found</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₹{Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Total</span>
                <span>₹{Number(order.total).toFixed(2)}</span>
              </div>
              {order.payment_method && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium flex items-center gap-2">
                    {order.payment_method === PaymentMethod.UPI ? (
                      <>
                        <QrCode className="h-4 w-4" />
                        <span>UPI</span>
                      </>
                    ) : (
                      <span>{order.payment_method}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

