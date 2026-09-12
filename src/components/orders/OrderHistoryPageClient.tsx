'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrderHistoryTable } from '@/components/tables/OrderHistoryTable';
import {
  OrderHistoryFilters,
  OrderHistoryFilters as FiltersType,
  getDateRangeForPreset,
} from '@/components/orders/OrderHistoryFilters';
import { OrderWithItems, Table, OrderStatus } from '@/lib/types';
import { useRealtimeOrders } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { useOutlet } from '@/hooks/useOutlet';

interface OrderHistoryPageClientProps {
  initialOrders?: OrderWithItems[];
  tables?: Table[];
  outletId?: string;
}

// In-memory cache across navigations
const historyOrdersCache: Record<string, OrderWithItems[]> = {};
const historyTablesCache: Record<string, Table[]> = {};

export function OrderHistoryPageClient({
  initialOrders = [],
  tables: initialTables = [],
  outletId: propOutletId,
}: OrderHistoryPageClientProps) {
  const { currentOutletId } = useOutlet();
  const outletId = propOutletId || currentOutletId || '';
  const cachedOrders = outletId ? historyOrdersCache[outletId] : undefined;
  const cachedTables = outletId ? historyTablesCache[outletId] : undefined;

  const [orders, setOrders] = useState<OrderWithItems[]>(() => cachedOrders || initialOrders);
  const [tables, setTables] = useState<Table[]>(() => cachedTables || initialTables);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(!cachedOrders && initialOrders.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Load preferred view mode from localStorage on client
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('resto_history_view_mode') as 'table' | 'card';
      if (savedMode === 'table' || savedMode === 'card') {
        setViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage read errors in SSR/sandboxed mode
    }
  }, []);

  const handleToggleViewMode = (mode: 'table' | 'card') => {
    setViewMode(mode);
    try {
      localStorage.setItem('resto_history_view_mode', mode);
    } catch {
      // Ignore
    }
  };

  // Fetch orders and tables if not provided initially
  useEffect(() => {
    if (!outletId) return;

    let isMounted = true;
    async function loadData() {
      try {
        const [ordersRes, tablesRes] = await Promise.all([
          fetch(`/api/orders?outlet_id=${outletId}&status=COMPLETED,CANCELLED`),
          fetch(`/api/tables?outlet_id=${outletId}`),
        ]);

        if (ordersRes.ok && isMounted) {
          const data = await ordersRes.json();
          const ords = data || [];
          setOrders(ords);
          historyOrdersCache[outletId] = ords;
        }
        if (tablesRes.ok && isMounted) {
          const tData = await tablesRes.json();
          const tbls = tData.tables || tData || [];
          setTables(tbls);
          historyTablesCache[outletId] = tbls;
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (initialOrders.length === 0) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [outletId, initialOrders.length]);

  // Function to refetch orders from API
  const refetchOrders = useCallback(async (isManual = false) => {
    if (!outletId) return;
    if (isManual) setIsSyncing(true);
    try {
      const response = await fetch(`/api/orders?outlet_id=${outletId}&status=COMPLETED,CANCELLED`);
      if (response.ok) {
        const data = await response.json();
        const ords = data || [];
        setOrders(ords);
        historyOrdersCache[outletId] = ords;
        if (isManual) {
          toast.success('Order history synced');
        }
      }
    } catch (error) {
      console.error('Failed to refetch order history:', error);
      if (isManual) {
        toast.error('Failed to sync order history');
      }
    } finally {
      if (isManual) {
        setTimeout(() => setIsSyncing(false), 400);
      }
    }
  }, [outletId]);

  // Subscribe to real-time changes
  useRealtimeOrders({
    outletId,
    onChange: (payload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRecord = payload.new as any;
      if (
        newRecord?.status === 'COMPLETED' ||
        newRecord?.status === 'CANCELLED' ||
        payload.eventType === 'UPDATE'
      ) {
        refetchOrders(false);
      }
    },
  });

  // Default filter: Last 30 Days
  const getDefaultFilters = (): FiltersType => {
    const { startDate, endDate } = getDateRangeForPreset('30d');
    return {
      datePreset: '30d',
      startDate,
      endDate,
      statuses: [],
      orderTypes: [],
      paymentMethods: [],
      tableId: undefined,
    };
  };

  const [filters, setFilters] = useState<FiltersType>(getDefaultFilters);

  // Apply search query and filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search Query filter (matches ID, Table, Staff, or Items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanId = order.id.replace(/-/g, '').toLowerCase();
        const idMatch = order.id.toLowerCase().includes(q) || cleanId.includes(q.replace(/-/g, ''));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableName = ((order as any).tables?.name || (order as any).table?.name || '').toLowerCase();
        const tableMatch = tableName.includes(q);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staffName = ((order as any).users?.name || (order as any).user?.name || '').toLowerCase();
        const staffMatch = staffName.includes(q);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (order as any).order_items || order.items || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemsMatch = items.some((oi: any) => {
          const itemName = oi.items?.name || oi.item?.name || oi.item_name || '';
          return itemName.toLowerCase().includes(q);
        });

        if (!idMatch && !tableMatch && !staffMatch && !itemsMatch) {
          return false;
        }
      }

      // 2. Date Range filter
      if (filters.startDate && filters.endDate) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate < filters.startDate || orderDate > filters.endDate) {
          return false;
        }
      } else if (filters.startDate) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate < filters.startDate) return false;
      } else if (filters.endDate) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate > filters.endDate) return false;
      }

      // 3. Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
        return false;
      }

      // 4. Order Type filter
      if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(order.order_type)) {
        return false;
      }

      // 5. Payment Method filter
      if (
        filters.paymentMethods.length > 0 &&
        order.payment_method &&
        !filters.paymentMethods.includes(order.payment_method)
      ) {
        return false;
      }

      // 6. Table filter
      if (filters.tableId && order.table_id !== filters.tableId) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, filters]);

  // Compute key summary metrics from filtered set
  const metrics = useMemo(() => {
    let completedCount = 0;
    let cancelledCount = 0;
    let totalRevenue = 0;
    let dineInCount = 0;
    let takeawayCount = 0;

    for (const order of filteredOrders) {
      if (order.status === OrderStatus.COMPLETED) {
        completedCount++;
        totalRevenue += Number(order.total) || 0;
      } else if (order.status === OrderStatus.CANCELLED) {
        cancelledCount++;
      }

      if (order.order_type === 'DINE_IN') {
        dineInCount++;
      } else {
        takeawayCount++;
      }
    }

    const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    return {
      totalRevenue,
      completedCount,
      cancelledCount,
      avgOrderValue,
      dineInCount,
      takeawayCount,
    };
  }, [filteredOrders]);

  const handleClearFilters = () => {
    setFilters(getDefaultFilters());
    setSearchQuery('');
  };

  const isPageLoading = loading && orders.length === 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Live Sync Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Order History
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground min-w-6 inline-flex items-center justify-center">
            {isPageLoading ? <Skeleton className="h-3 w-5" /> : filteredOrders.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Sync Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Sync</span>
          </div>

          {/* Sync Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchOrders(true)}
            disabled={isSyncing}
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 border-border/70"
            title="Refresh order history"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          {/* View Mode Toggle (Desktop/Tablet) */}
          <div className="hidden md:flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => handleToggleViewMode('table')}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Dense Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Table</span>
            </button>
            <button
              onClick={() => handleToggleViewMode('card')}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'card'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Sales */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Sales
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {isPageLoading ? <Skeleton className="h-7 w-20 my-0.5" /> : `₹${metrics.totalRevenue.toFixed(2)}`}
          </div>
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            {metrics.completedCount} {metrics.completedCount === 1 ? 'bill settled' : 'bills settled'}
          </p>
        </div>

        {/* Completed Orders */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {isPageLoading ? <Skeleton className="h-7 w-12 my-0.5" /> : metrics.completedCount}
          </div>
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            {metrics.dineInCount} Dine-In • {metrics.takeawayCount} Takeaway
          </p>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cancelled
            </span>
            <div className="h-7 w-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {isPageLoading ? <Skeleton className="h-7 w-10 my-0.5" /> : metrics.cancelledCount}
          </div>
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            {metrics.cancelledCount === 0 ? 'Zero cancellations' : 'Voided or cancelled'}
          </p>
        </div>

        {/* Average Ticket Size */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Ticket
            </span>
            <div className="h-7 w-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {isPageLoading ? <Skeleton className="h-7 w-16 my-0.5" /> : `₹${metrics.avgOrderValue.toFixed(2)}`}
          </div>
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            Average spend per order
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <OrderHistoryFilters
        tables={tables}
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalFilteredCount={filteredOrders.length}
        totalOrdersCount={orders.length}
      />

      {/* 4. Order History Table / Cards */}
      <OrderHistoryTable
        orders={filteredOrders}
        outletId={outletId}
        viewMode={viewMode}
        loading={isPageLoading}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}
