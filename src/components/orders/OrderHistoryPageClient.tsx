'use client';

import { useState, useEffect } from 'react';
import { OrderHistoryTable } from '@/components/tables/OrderHistoryTable';
import { OrderHistoryFilters, OrderHistoryFilters as FiltersType } from '@/components/orders/OrderHistoryFilters';
import { OrderWithItems } from '@/lib/types';
import { Table } from '@/lib/types';

interface OrderHistoryPageClientProps {
  initialOrders: OrderWithItems[];
  tables: Table[];
  outletId: string;
}

export function OrderHistoryPageClient({ initialOrders, tables, outletId }: OrderHistoryPageClientProps) {
  // Set default to last 30 days
  const getDefaultFilters = (): FiltersType => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      statuses: [],
      orderTypes: [],
      paymentMethods: [],
    };
  };

  const [filters, setFilters] = useState<FiltersType>(getDefaultFilters());

  // Apply filters
  const filteredOrders = initialOrders.filter((order) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'filtering order',data:{orderId:order.id,orderStatus:order.status,orderType:order.order_type,orderPaymentMethod:order.payment_method,filters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    // Date range filter
    if (filters.startDate && filters.endDate) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate < filters.startDate || orderDate > filters.endDate) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'filtered out by date',data:{orderId:order.id,orderDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return false;
      }
    }

    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'filtered out by status',data:{orderId:order.id,orderStatus:order.status,filterStatuses:filters.statuses,includes:filters.statuses.includes(order.status)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return false;
    }

    // Order type filter
    if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(order.order_type)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'filtered out by orderType',data:{orderId:order.id,orderType:order.order_type,filterOrderTypes:filters.orderTypes,includes:filters.orderTypes.includes(order.order_type)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return false;
    }

    // Payment method filter
    if (filters.paymentMethods.length > 0 && order.payment_method && !filters.paymentMethods.includes(order.payment_method)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'filtered out by paymentMethod',data:{orderId:order.id,orderPaymentMethod:order.payment_method,filterPaymentMethods:filters.paymentMethods,includes:order.payment_method?filters.paymentMethods.includes(order.payment_method):'no payment method'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return false;
    }

    // Table filter
    if (filters.tableId && order.table_id !== filters.tableId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'filtered out by table',data:{orderId:order.id,orderTableId:order.table_id,filterTableId:filters.tableId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return false;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryPageClient.tsx:filter',message:'order passed all filters',data:{orderId:order.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600">View completed and cancelled orders</p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {initialOrders.length} orders
          </p>
        </div>
      </div>
      <OrderHistoryFilters
        tables={tables}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className="mt-4" />
      <OrderHistoryTable orders={filteredOrders} outletId={outletId} />
    </div>
  );
}

