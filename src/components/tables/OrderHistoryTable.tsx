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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No order history found</p>
                    <p className="text-sm text-muted-foreground">
                      Completed and cancelled orders will appear here. To complete an order, go to Orders page and generate a bill for a served order.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.table?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{order.user?.name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(order)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === OrderStatus.COMPLETED && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReprint(order)}
                          title="Reprint Receipt"
                        >
                          <Receipt className="h-4 w-4" />
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

