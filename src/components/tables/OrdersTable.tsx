'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrderStatus } from '@/lib/types';
import { OrderWithItems } from '@/lib/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { BillModal } from '@/components/billing/BillModal';
import { OrderForm } from '@/components/forms/OrderForm';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { Table as TableType } from '@/lib/types';
import { Plus, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { OrdersFilters, OrdersFilters as FiltersType } from '@/components/orders/OrdersFilters';

interface OrdersTableProps {
  orders: any[];
  outletId: string;
  tables: TableType[];
}

export function OrdersTable({ orders: initialOrders, outletId, tables: initialTables }: OrdersTableProps) {
  const router = useRouter();
  const { 
    orders: storeOrders, 
    tables: storeTables, 
    setOrders, 
    setTables, 
    updateOrder 
  } = useTableOrderStore();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersType>({
    datePreset: 'today',
    statuses: [],
    orderTypes: [],
  });

  // Initialize store with data from server
  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
    if (initialTables && initialTables.length > 0) {
      setTables(initialTables);
    }
  }, [initialOrders, initialTables, setOrders, setTables]);

  // Use store data, fallback to initial data
  const allOrders = storeOrders.length > 0 ? storeOrders : initialOrders;
  const tables = storeTables.length > 0 ? storeTables : initialTables;

  // Apply filters
  const getDateRange = (preset: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = now.getMonth();
    const localDate = now.getDate();

    switch (preset) {
      case 'today': {
        const start = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'yesterday': {
        const start = new Date(localYear, localMonth, localDate - 1, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'last7days': {
        const start = new Date(localYear, localMonth, localDate - 6, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'last30days': {
        const start = new Date(localYear, localMonth, localDate - 29, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'custom': {
        if (customStart && customEnd) {
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          return { start: start.toISOString(), end: end.toISOString() };
        }
        return null;
      }
      default:
        return null;
    }
  };

  const filteredOrders = allOrders.filter((order) => {
    // Date filter
    const dateRange = getDateRange(filters.datePreset, filters.customStartDate, filters.customEndDate);
    if (dateRange) {
      const orderDate = new Date(order.created_at);
      if (orderDate < new Date(dateRange.start) || orderDate >= new Date(dateRange.end)) {
        return false;
      }
    }

    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
      return false;
    }

    // Order type filter
    if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(order.order_type)) {
      return false;
    }

    // Table filter
    if (filters.tableId && order.table_id !== filters.tableId) {
      return false;
    }

    return true;
  });

  const orders = filteredOrders;

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

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      const updatedOrder = await response.json();
      
      // Update store with the updated order (this will handle table status changes)
      updateOrder(updatedOrder);

      toast.success('Order status updated');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handleBill = (order: any) => {
    setSelectedOrder(order);
    setBillModalOpen(true);
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleCancelClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-600">
            Showing {orders.length} of {allOrders.length} orders
          </p>
        </div>
        <Button onClick={() => setOrderFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>
      <OrdersFilters
        tables={tables}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className="mt-4" />
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.order_type}</TableCell>
                  <TableCell>{order.tables?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{Number(order.total).toFixed(2)}</TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Details Button - Always visible */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(order)}
                        title="View Order Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Cancel Button - Only for non-completed/cancelled orders */}
                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelClick(order.id)}
                          title="Cancel Order"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Status Update Buttons */}
                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <>
                          {order.status === 'NEW' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === 'PREPARING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(order.id, 'READY')}
                            >
                              Mark Ready
                            </Button>
                          )}
                          {order.status === 'READY' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                            >
                              Mark Served
                            </Button>
                          )}
                          {order.status === 'SERVED' && (
                            <Button
                              size="sm"
                              onClick={() => handleBill(order)}
                            >
                              Generate Bill
                            </Button>
                          )}
                        </>
                      )}
                      {order.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBill(order)}
                        >
                          View Bill
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
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          order={selectedOrder}
        />
      )}
      <OrderForm
        open={orderFormOpen}
        onOpenChange={setOrderFormOpen}
        outletId={outletId}
        tables={tables}
        onSuccess={async () => {
          // Refresh tables and orders from server
          const tablesRes = await fetch(`/api/tables?outlet_id=${outletId}`);
          if (tablesRes.ok) {
            const tablesData = await tablesRes.json();
            const updatedTables = tablesData.tables || tablesData || [];
            setTables(updatedTables);
          }
          router.refresh();
        }}
      />
      {selectedOrder && (
        <OrderDetailsModal
          open={orderDetailsOpen}
          onOpenChange={setOrderDetailsOpen}
          order={selectedOrder}
        />
      )}
      {orderToCancel && (
        <CancelOrderDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          orderId={orderToCancel}
          onSuccess={async () => {
            setOrderToCancel(null);
            // Refresh orders from server to get updated data
            const ordersRes = await fetch(`/api/orders?outlet_id=${outletId}`);
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              setOrders(ordersData);
            }
            router.refresh();
          }}
        />
      )}
    </>
  );
}

