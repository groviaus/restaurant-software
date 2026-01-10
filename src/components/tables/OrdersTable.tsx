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
import { useState, useEffect, useCallback } from 'react';
import { BillModal } from '@/components/billing/BillModal';
import { OrderForm } from '@/components/forms/OrderForm';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { Table as TableType } from '@/lib/types';
import { Plus, Eye, X, Filter, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { OrdersFilters, OrdersFilters as FiltersType } from '@/components/orders/OrdersFilters';
import { usePermissions } from '@/hooks/usePermissions';
import { useRealtimeOrders } from '@/hooks/useRealtime';

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
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null);
  const [filters, setFilters] = useState<FiltersType>({
    datePreset: 'today',
    statuses: [],
    orderTypes: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  const { checkPermission, isAdmin } = usePermissions();
  const canCreateOrder = isAdmin || checkPermission('orders', 'create');
  const canEditOrder = isAdmin || checkPermission('orders', 'edit');
  
  // Check if an order can be edited (not completed or cancelled)
  const canEditThisOrder = (order: any) => {
    return canEditOrder && order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
  };

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

  // Function to refetch orders from API
  const refetchOrders = useCallback(async () => {
    try {
      console.log('[OrdersTable] Refetching orders...');
      // Calculate today's date range to match server-side filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString();
      
      const response = await fetch(
        `/api/orders?outlet_id=${outletId}&start_date=${encodeURIComponent(todayStart)}&end_date=${encodeURIComponent(todayEnd)}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('[OrdersTable] Refetched orders:', data?.length || 0, 'orders');
        if (data && Array.isArray(data)) {
          setOrders(data);
        }
      } else {
        const errorText = await response.text();
        console.error('[OrdersTable] Failed to refetch orders:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('[OrdersTable] Failed to refetch orders:', error);
    }
  }, [outletId, setOrders]);

  // Subscribe to real-time order changes
  useRealtimeOrders({
    outletId,
    onChange: (payload) => {
      console.log('[OrdersTable] Realtime change received:', payload.eventType);
      // Refetch orders when any change happens on another device
      refetchOrders();
      // Also refresh the router to ensure server-side data is updated
      router.refresh();
    },
    onInsert: (payload) => {
      console.log('[OrdersTable] New order inserted:', payload);
      refetchOrders();
      router.refresh();
    },
    onUpdate: (payload) => {
      console.log('[OrdersTable] Order updated:', payload);
      refetchOrders();
      router.refresh();
    },
  });

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

  const handleEditOrder = (order: any) => {
    setOrderToEdit(order);
    setOrderFormOpen(true);
  };

  const handleOrderFormSuccess = async () => {
    // Refetch orders to get updated data
    await refetchOrders();
    setOrderToEdit(null);
    router.refresh();
  };

  const handleCancelClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <p className="text-xs sm:text-sm text-gray-600">
            Showing {orders.length} of {allOrders.length} orders
          </p>

          <Filter className="h-4 w-4 mr-2" onClick={() => setShowFilters(!showFilters)} />

        </div>
        {canCreateOrder && (
          <Button onClick={() => setOrderFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Create Order</span>
            <span className="xs:hidden">New Order</span>
          </Button>
        )}
      </div>
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <OrdersFilters
          tables={tables}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <div className="mt-4" />
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No orders found
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
                    <Badge className={getStatusColor(order.status)} variant="outline">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{order.order_type}</span>
                    {order.tables?.name && (
                      <>
                        <span>•</span>
                        <span>{order.tables.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-gray-900">
                    ₹{Number(order.total).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'dd/MM HH:mm')}
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(order)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEditThisOrder(order) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditOrder(order)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelClick(order.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                    <>
                      {order.status === OrderStatus.NEW && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                          className="text-xs h-8 px-3"
                        >
                          Prepare
                        </Button>
                      )}
                      {order.status === OrderStatus.PREPARING && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                          className="text-xs h-8 px-3"
                        >
                          Ready
                        </Button>
                      )}
                      {order.status === OrderStatus.READY && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.SERVED)}
                          className="text-xs h-8 px-3"
                        >
                          Served
                        </Button>
                      )}
                      {order.status === OrderStatus.SERVED && (
                        <Button
                          size="sm"
                          onClick={() => handleBill(order)}
                          className="text-xs h-8 px-3"
                        >
                          Bill
                        </Button>
                      )}
                    </>
                  )}
                  {order.status === 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBill(order)}
                      className="text-xs h-8 px-3"
                    >
                      Bill
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Order ID</TableHead>
                <TableHead className="min-w-[80px]">Type</TableHead>
                <TableHead className="min-w-[80px]">Table</TableHead>
                <TableHead className="min-w-[90px]">Status</TableHead>
                <TableHead className="min-w-[80px]">Total</TableHead>
                <TableHead className="min-w-[140px]">Created</TableHead>
                <TableHead className="text-right min-w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs sm:text-sm">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{order.order_type}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{order.tables?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">₹{Number(order.total).toFixed(2)}</TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5 sm:gap-2 flex-nowrap overflow-x-auto">
                        {/* View Details Button - Always visible */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(order)}
                          title="View Order Details"
                          className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] p-0 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>

                        {/* Edit Order Button - Only for editable orders */}
                        {canEditThisOrder(order) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditOrder(order)}
                            title="Edit Order"
                            className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] p-0 shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        )}

                        {/* Cancel Button - Only for non-completed/cancelled orders */}
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelClick(order.id)}
                            title="Cancel Order"
                            className="h-8 w-8 sm:min-h-[36px] sm:min-w-[36px] p-0 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        )}

                        {/* Status Update Buttons */}
                        {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                          <>
                            {order.status === OrderStatus.NEW && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                                className="text-[10px] sm:text-xs whitespace-nowrap h-8 px-2 sm:px-3 shrink-0"
                              >
                                <span className="hidden sm:inline">Start Preparing</span>
                                <span className="sm:hidden">Prepare</span>
                              </Button>
                            )}
                            {order.status === OrderStatus.PREPARING && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                                className="text-[10px] sm:text-xs whitespace-nowrap h-8 px-2 sm:px-3 shrink-0"
                              >
                                <span className="hidden sm:inline">Mark Ready</span>
                                <span className="sm:hidden">Ready</span>
                              </Button>
                            )}
                            {order.status === OrderStatus.READY && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.SERVED)}
                                className="text-[10px] sm:text-xs whitespace-nowrap h-8 px-2 sm:px-3 shrink-0"
                              >
                                <span className="hidden sm:inline">Mark Served</span>
                                <span className="sm:hidden">Served</span>
                              </Button>
                            )}
                            {order.status === OrderStatus.SERVED && (
                              <Button
                                size="sm"
                                onClick={() => handleBill(order)}
                                className="text-[10px] sm:text-xs whitespace-nowrap h-8 px-2 sm:px-3 shrink-0"
                              >
                                <span className="hidden sm:inline">Generate Bill</span>
                                <span className="sm:hidden">Bill</span>
                              </Button>
                            )}
                          </>
                        )}
                        {order.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBill(order)}
                            className="text-[10px] sm:text-xs whitespace-nowrap h-8 px-2 sm:px-3 shrink-0"
                          >
                            <span className="hidden sm:inline">View Bill</span>
                            <span className="sm:hidden">Bill</span>
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
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          order={selectedOrder}
        />
      )}
      <OrderForm
        open={orderFormOpen}
        onOpenChange={(open) => {
          setOrderFormOpen(open);
          if (!open) {
            setOrderToEdit(null);
          }
        }}
        outletId={outletId}
        tables={tables}
        order={orderToEdit}
        onSuccess={async () => {
          // Refresh tables and orders from server
          const tablesRes = await fetch(`/api/tables?outlet_id=${outletId}`);
          if (tablesRes.ok) {
            const tablesData = await tablesRes.json();
            const updatedTables = tablesData.tables || tablesData || [];
            setTables(updatedTables);
          }
          const ordersRes = await fetch(`/api/orders?outlet_id=${outletId}`);
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setOrders(ordersData);
            // If order details modal is open, refresh the selected order
            if (selectedOrder && orderToEdit && selectedOrder.id === orderToEdit.id) {
              const updatedOrder = ordersData.find((o: any) => o.id === selectedOrder.id);
              if (updatedOrder) {
                // Fetch full order details
                const fullOrderRes = await fetch(`/api/orders/${updatedOrder.id}`);
                if (fullOrderRes.ok) {
                  const fullOrder = await fullOrderRes.json();
                  setSelectedOrder(fullOrder);
                }
              }
            }
          }
          setOrderToEdit(null);
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

