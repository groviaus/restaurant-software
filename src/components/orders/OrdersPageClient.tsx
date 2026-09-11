'use client';

import { useMemo, useState, useCallback } from 'react';
import { OrdersTable } from '@/components/tables/OrdersTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdersQuery } from '@/hooks/queries/useOrdersQuery';
import { useTablesQuery } from '@/hooks/queries/useTablesQuery';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Flame,
  Bell,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdersPageClientProps {
  outletId: string;
}

export function OrdersPageClient({ outletId }: OrdersPageClientProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();
    return { start_date: todayStart, end_date: todayEnd };
  }, []);

  // 1. Fetch ALL unresolved active orders (NEW, PREPARING, READY, SERVED) regardless of creation date
  const activeOrdersQuery = useOrdersQuery(outletId, {
    status: 'NEW,PREPARING,READY,SERVED',
    limit: 200,
  });

  // 2. Fetch today's completed/cancelled orders
  const todayClosedQuery = useOrdersQuery(outletId, {
    status: 'COMPLETED,CANCELLED',
    ...todayRange,
    limit: 200,
  });

  const tablesQuery = useTablesQuery(outletId);

  const orders = useMemo(() => {
    const active = activeOrdersQuery.data ?? [];
    const closed = todayClosedQuery.data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    for (const o of active) map.set(o.id, o);
    for (const o of closed) map.set(o.id, o);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activeOrdersQuery.data, todayClosedQuery.data]);

  const tables = useMemo(() => tablesQuery.data ?? [], [tablesQuery.data]);
  const loading = (activeOrdersQuery.isLoading && todayClosedQuery.isLoading) && tablesQuery.isLoading;
  const error = activeOrdersQuery.error ?? todayClosedQuery.error ?? tablesQuery.error;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['tables'] }),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [queryClient]);

  // Operational metrics calculated in real-time
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    const kitchen = orders.filter((o) => o.status === 'PREPARING');
    const ready = orders.filter((o) => o.status === 'READY');
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const completedSales = completed.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    return {
      activeCount: active.length,
      kitchenCount: kitchen.length,
      readyCount: ready.length,
      completedCount: completed.length,
      completedSales,
    };
  }, [orders]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage and track live restaurant operations</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {error instanceof Error ? error.message : 'Failed to load order data'}
          </p>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0 && tables.length === 0) {
    return <OrdersPageSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Page Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Live Orders
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Realtime Connected</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track kitchen flow, prepare dishes, and process table checkout.
          </p>
        </div>

        {/* Global Action Header Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8.5 px-2.5 sm:px-3 text-xs font-medium rounded-lg border-border/60 bg-card/60 hover:bg-muted/80 shadow-2xs transition-all active:scale-95"
          >
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Operational KPI Pipeline Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Orders */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md transition-all hover:border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Active Orders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
              {stats.activeCount}
            </span>
            <span className="text-[11px] text-muted-foreground">in service</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/40" />
        </div>

        {/* In Kitchen */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md transition-all hover:border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Kitchen Queue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {stats.kitchenCount}
            </span>
            <span className="text-[11px] text-muted-foreground">preparing</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/50" />
        </div>

        {/* Ready to Serve */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md transition-all hover:border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Ready to Serve</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.readyCount}
            </span>
            <span className="text-[11px] text-muted-foreground">pickup ready</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/50" />
        </div>

        {/* Today's Sales Volume */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md transition-all hover:border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Today&apos;s Revenue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
              ₹{stats.completedSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({stats.completedCount} billed)
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500/50" />
        </div>
      </div>

      {/* Main Interactive Orders Table / Ticket Cards */}
      <OrdersTable
        orders={orders}
        outletId={outletId}
        tables={tables}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="rounded-2xl border border-border/60 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
