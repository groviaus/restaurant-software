'use client';

import { useState, useEffect } from 'react';
import { OrdersTable } from '@/components/tables/OrdersTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Table as TableType } from '@/lib/types';

interface OrdersPageClientProps {
  outletId: string;
}

export function OrdersPageClient({ outletId }: OrdersPageClientProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountTime = performance.now();
  console.log('[Orders] Page shell visible at', mountTime.toFixed(0), 'ms (instant after click)');

  useEffect(() => {
    let cancelled = false;
    const fetchStart = performance.now();
    console.log('[Orders] Data fetch started at', fetchStart.toFixed(0), 'ms');

    async function fetchData() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString();

      const ordersUrl = `/api/orders?outlet_id=${outletId}&limit=50&start_date=${encodeURIComponent(todayStart)}&end_date=${encodeURIComponent(todayEnd)}`;
      const tablesUrl = `/api/tables?outlet_id=${outletId}`;

      try {
        const [ordersRes, tablesRes] = await Promise.all([
          fetch(ordersUrl),
          fetch(tablesUrl),
        ]);

        if (cancelled) return;

        if (!ordersRes.ok) {
          const errData = await ordersRes.json().catch(() => ({}));
          setError(errData?.error || 'Failed to load orders');
          setLoading(false);
          return;
        }

        if (!tablesRes.ok) {
          setError('Failed to load tables');
          setLoading(false);
          return;
        }

        const [ordersData, tablesPayload] = await Promise.all([
          ordersRes.json(),
          tablesRes.json(),
        ]);

        if (cancelled) return;

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setTables(Array.isArray(tablesPayload?.tables) ? tablesPayload.tables : []);
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          const end = performance.now();
          console.log('[Orders] Data fetch finished at', end.toFixed(0), 'ms (took', (end - fetchStart).toFixed(0), 'ms)');
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track orders</p>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track orders</p>
        </div>
        <OrdersTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage and track orders</p>
      </div>
      <OrdersTable orders={orders} outletId={outletId} tables={tables} />
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4 border-b flex gap-4 flex-wrap">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
