'use client';

import { useMemo } from 'react';
import { OrdersTable } from '@/components/tables/OrdersTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdersQuery } from '@/hooks/queries/useOrdersQuery';
import { useTablesQuery } from '@/hooks/queries/useTablesQuery';

interface OrdersPageClientProps {
  outletId: string;
}

export function OrdersPageClient({ outletId }: OrdersPageClientProps) {
  const todayRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();
    return { start_date: todayStart, end_date: todayEnd };
  }, []);

  const ordersQuery = useOrdersQuery(outletId, { ...todayRange, limit: 50 });
  const tablesQuery = useTablesQuery(outletId);

  const orders = ordersQuery.data ?? [];
  const tables = tablesQuery.data ?? [];
  const loading = ordersQuery.isLoading && tablesQuery.isLoading;
  const error = ordersQuery.error ?? tablesQuery.error;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track orders</p>
        </div>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Failed to load data'}</p>
      </div>
    );
  }

  if (loading && orders.length === 0 && tables.length === 0) {
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
