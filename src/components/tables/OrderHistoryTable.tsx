'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderWithItems } from '@/lib/types';
import { OrderStatus } from '@/lib/types';
import { Receipt, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { BillModal } from '@/components/billing/BillModal';
import { format } from 'date-fns';

interface OrderHistoryTableProps {
  orders: OrderWithItems[];
  outletId: string;
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'default';
      case OrderStatus.CANCELLED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleReprint = async (order: OrderWithItems) => {
    if (order.status !== OrderStatus.COMPLETED) {
      toast.error('Can only reprint completed orders');
      return;
    }
    setSelectedOrder(order);
    setBillModalOpen(true);
  };

  const handleViewDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setBillModalOpen(true);
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-3 max-w-sm mx-auto">
              <p className="text-muted-foreground font-medium">No order history found</p>
              <p className="text-xs text-muted-foreground">
                Completed and cancelled orders will appear here. To complete an order, go to Orders page and generate a bill for a served order.
              </p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-4 space-y-3 shadow-sm"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</span>
                    <Badge variant={getStatusColor(order.status)} className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {order.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                    </Badge>
                    {(order as any).tables?.name || (order as any).table?.name ? (
                      <>
                        <span>•</span>
                        <span>{(order as any).tables?.name || (order as any).table?.name}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    Staff: {(order as any).users?.name || (order as any).user?.name || '-'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-gray-900">
                    ₹{order.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'dd/MM HH:mm')}
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(order)}
                  className="h-8 px-3 text-xs"
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  View
                </Button> */}
                {order.status === OrderStatus.COMPLETED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReprint(order)}
                    className="h-8 px-3 text-xs"
                  >
                    <Receipt className="h-4 w-4 mr-1.5" />
                    Receipt
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <div className="overflow-x-auto text-responsive-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Order ID</TableHead>
                <TableHead className="min-w-[90px]">Type</TableHead>
                <TableHead className="min-w-[100px]">Table</TableHead>
                <TableHead className="min-w-[110px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Total</TableHead>
                <TableHead className="min-w-[140px]">Created</TableHead>
                <TableHead className="min-w-[120px]">Staff</TableHead>
                <TableHead className="text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="space-y-3 max-w-sm mx-auto">
                      <p className="text-muted-foreground font-medium">No order history found</p>
                      <p className="text-xs text-muted-foreground">
                        Completed and cancelled orders will appear here. To complete an order, go to Orders page and generate a bill for a served order.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-[10px] sm:text-xs">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">
                        {order.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {(order as any).tables?.name || (order as any).table?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status)} className="text-[10px] sm:text-xs">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-xs sm:text-sm text-gray-900">
                      ₹{order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-xs whitespace-nowrap">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm max-w-[120px] truncate">
                      {(order as any).users?.name || (order as any).user?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(order)}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          aria-label="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button> */}
                        {order.status === OrderStatus.COMPLETED && (
                           <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleReprint(order)}
                           className="h-8 px-3 text-xs"
                         >
                           <Receipt className="h-4 w-4 mr-1.5" />
                           Receipt
                         </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {selectedOrder && (
        <BillModal
          order={selectedOrder}
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          readOnly={true}
        />
      )}
    </>
  );
}

