'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeOrders, useRealtimeInventory } from '@/hooks/useRealtime';
import { SalesTrendChart } from '@/components/charts/SalesTrendChart';
import { PaymentBreakdownChart } from '@/components/charts/PaymentBreakdownChart';
import { PeakHoursChart } from '@/components/charts/PeakHoursChart';
import { TopItemsList } from '@/components/charts/TopItemsList';
import { StaffPerformanceList } from '@/components/charts/StaffPerformanceList';
import { AlertTriangle, Package, DollarSign, ShoppingCart, Calendar, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useOutlet } from '@/hooks/useOutlet';
import { AlertBanner, type Alert } from '@/components/dashboard/AlertBanner';
import { ActiveOrdersWidget } from '@/components/dashboard/ActiveOrdersWidget';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { QuickActionsDesktop } from '@/components/dashboard/QuickActionsDesktop';

interface DashboardClientProps {
  initialTotalSales: number;
  initialTotalOrders: number;
  initialCompletedOrders: number;
  initialTopItem: string;
  initialLowStockAlertsCount: number;
  initialTotalInventoryItems: number;
  outletId: string;
}

export function DashboardClient({
  initialTotalSales,
  initialTotalOrders,
  initialCompletedOrders,
  initialTopItem,
  initialLowStockAlertsCount,
  initialTotalInventoryItems,
  outletId,
}: DashboardClientProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const { currentOutletId } = useOutlet();
  const [totalSales, setTotalSales] = useState(initialTotalSales);
  const [totalOrders, setTotalOrders] = useState(initialTotalOrders);
  const [completedOrders, setCompletedOrders] = useState(initialCompletedOrders);
  const [topItem, setTopItem] = useState(initialTopItem);
  const [lowStockAlertsCount, setLowStockAlertsCount] = useState(initialLowStockAlertsCount);
  const [totalInventoryItems, setTotalInventoryItems] = useState(initialTotalInventoryItems);
  const [loading, setLoading] = useState(false);

  // Function to fetch dashboard data client-side (fallback for Capacitor)
  const fetchDashboardData = useCallback(async () => {
    const effectiveOutletId = currentOutletId || outletId;
    if (!effectiveOutletId) {
      console.warn('[Dashboard] No outlet ID available for client-side fetch');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Get today's date range - use IST timezone to match server-side and orders page
      // This ensures consistency across all components
      const now = new Date();

      // Use local timezone (which should match IST for the restaurant)
      // This matches the orders page behavior which uses local timezone
      const localYear = now.getFullYear();
      const localMonth = now.getMonth();
      const localDate = now.getDate();
      const todayStart = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
      const todayEnd = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);

      console.log('[Dashboard] Client-side fetch - Date range:', {
        outletId: effectiveOutletId,
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString(),
        clientTime: now.toISOString(),
      });

      // Fetch today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .eq('outlet_id', effectiveOutletId)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (ordersError) {
        console.error('[Dashboard] Error fetching orders:', ordersError);
      } else if (todayOrders) {
        const sales = todayOrders.reduce((sum, order: { status: string; total: number | string }) => {
          return sum + (order.status === 'COMPLETED' ? (Number(order.total) || 0) : 0);
        }, 0);
        const orders = todayOrders.length;
        const completed = todayOrders.filter((o: { status: string }) => o.status === 'COMPLETED').length;

        setTotalSales(sales);
        setTotalOrders(orders);
        setCompletedOrders(completed);
      }

      // Fetch top item
      const { data: topItemsData } = await supabase
        .from('orders')
        .select(`
          order_items (
            quantity,
            items (
              name
            )
          )
        `)
        .eq('outlet_id', effectiveOutletId)
        .eq('status', 'COMPLETED')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString())
        .limit(100);

      if (topItemsData) {
        const itemCounts = new Map<string, { name: string; count: number }>();
        topItemsData.forEach((order: { order_items?: Array<{ quantity: number; items?: { name: string } | null }> }) => {
          order.order_items?.forEach((oi) => {
            if (oi.items) {
              const key = oi.items.name;
              const existing = itemCounts.get(key) || { name: key, count: 0 };
              existing.count += oi.quantity;
              itemCounts.set(key, existing);
            }
          });
        });

        if (itemCounts.size > 0) {
          const top = Array.from(itemCounts.values()).sort((a, b) => b.count - a.count)[0].name;
          setTopItem(top);
        }
      }

      // Fetch inventory summary
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('stock, low_stock_threshold')
        .eq('outlet_id', effectiveOutletId);

      if (inventoryData) {
        setTotalInventoryItems(inventoryData.length);
        setLowStockAlertsCount(
          inventoryData.filter((inv: { stock: number; low_stock_threshold: number }) => inv.stock <= inv.low_stock_threshold).length
        );
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOutletId, outletId]);

  // Function to refetch dashboard data
  const refetchDashboard = useCallback(async () => {
    try {
      console.log('[Dashboard] Refetching dashboard data...');
      // Try client-side fetch first (works better in Capacitor)
      await fetchDashboardData();
      // Also refresh server-side data
      router.refresh();
    } catch (error) {
      console.error('[Dashboard] Failed to refetch dashboard:', error);
    }
  }, [router, fetchDashboardData]);

  // Subscribe to real-time order changes
  useRealtimeOrders({
    outletId,
    onChange: (payload) => {
      console.log('[Dashboard] Realtime order change received:', payload.eventType);
      // Refresh dashboard when orders change (this will also update inventory if order was completed)
      refetchDashboard();
    },
    onInsert: () => {
      console.log('[Dashboard] New order inserted');
      refetchDashboard();
    },
    onUpdate: () => {
      console.log('[Dashboard] Order updated');
      // When order is completed, inventory is updated, so refresh dashboard
      refetchDashboard();
    },
  });

  // Subscribe to real-time inventory changes
  useRealtimeInventory({
    outletId,
    onChange: (payload) => {
      console.log('[Dashboard] Realtime inventory change received:', payload.eventType);
      // Refresh dashboard when inventory changes
      refetchDashboard();
    },
    onInsert: () => {
      console.log('[Dashboard] New inventory item inserted');
      refetchDashboard();
    },
    onUpdate: () => {
      console.log('[Dashboard] Inventory item updated');
      refetchDashboard();
    },
  });

  // Update state when props change (from server refresh)
  useEffect(() => {
    setTotalSales(initialTotalSales);
    setTotalOrders(initialTotalOrders);
    setCompletedOrders(initialCompletedOrders);
    setTopItem(initialTopItem);
    setLowStockAlertsCount(initialLowStockAlertsCount);
    setTotalInventoryItems(initialTotalInventoryItems);
  }, [initialTotalSales, initialTotalOrders, initialCompletedOrders, initialTopItem, initialLowStockAlertsCount, initialTotalInventoryItems]);

  // Client-side fetch fallback: trigger when server data looks incomplete or suspicious
  // This is important for Capacitor apps where server-side cookies might not work
  // Also helps when Vercel returns incomplete data due to timezone/auth issues
  useEffect(() => {
    const effectiveOutletId = currentOutletId || outletId;

    // Determine if we should fetch fallback data
    // Trigger when:
    // 1. Both sales and orders are 0 (no data at all)
    // 2. Sales is 0 but orders > 0 (suspicious - should have sales if there are orders)
    // 3. Sales > 0 but orders is 0 (suspicious - can't have sales without orders)
    const shouldFetchFallback =
      effectiveOutletId &&
      profile &&
      (
        (initialTotalSales === 0 && initialTotalOrders === 0) || // No data at all
        (initialTotalSales === 0 && initialTotalOrders > 0) ||   // Orders but no sales (incomplete data)
        (initialTotalSales > 0 && initialTotalOrders === 0)     // Sales but no orders (incomplete data)
      );

    if (shouldFetchFallback) {
      console.log('[Dashboard] Server data looks incomplete, fetching client-side data...', {
        outletId: effectiveOutletId,
        initialSales: initialTotalSales,
        initialOrders: initialTotalOrders,
        reason: initialTotalSales === 0 && initialTotalOrders === 0
          ? 'no_data'
          : initialTotalSales === 0 && initialTotalOrders > 0
            ? 'orders_but_no_sales'
            : 'sales_but_no_orders',
      });
      fetchDashboardData();
    }
  }, [currentOutletId, outletId, profile, initialTotalSales, initialTotalOrders, fetchDashboardData]);

  // Generate alerts based on low stock and other conditions
  const alerts: Alert[] = [];

  if (lowStockAlertsCount > 0) {
    alerts.push({
      id: 'low-stock',
      message: `${lowStockAlertsCount} item${lowStockAlertsCount > 1 ? 's' : ''} running low on stock`,
      severity: 'warning',
      actionLabel: 'View Inventory',
      actionHref: '/inventory',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop Quick Actions - Only on Dashboard */}
      <QuickActionsDesktop />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-0">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Ops</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Overview of today&apos;s orders, sales revenue, and inventory status
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/60 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <button
            onClick={refetchDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium text-foreground shadow-xs transition-all hover:bg-muted/80 active:scale-95 disabled:opacity-50"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="px-1 sm:px-0">
          <AlertBanner alerts={alerts} />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 px-1 sm:px-0">
        <MetricCard
          title="Today's Sales"
          value={`₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${completedOrders} completed orders`}
          icon={<DollarSign className="h-4 w-4" />}
          accentColor="emerald"
          href="/orders"
          loading={loading}
        />

        <MetricCard
          title="Today's Orders"
          value={totalOrders}
          subtitle="Total orders placed"
          icon={<ShoppingCart className="h-4 w-4" />}
          accentColor="blue"
          href="/orders"
          loading={loading}
        />

        <MetricCard
          title="Top Item"
          value={topItem}
          subtitle="Best seller today"
          icon={<UtensilsCrossed className="h-4 w-4" />}
          accentColor="amber"
          href="/menu"
          loading={loading}
          className="col-span-2 sm:col-span-1"
        />

        <MetricCard
          title="Inventory Items"
          value={totalInventoryItems}
          subtitle="Total tracked SKUs"
          icon={<Package className="h-4 w-4" />}
          accentColor="violet"
          href="/inventory"
          loading={loading}
        />

        <MetricCard
          title="Low Stock Alerts"
          value={lowStockAlertsCount}
          subtitle={lowStockAlertsCount > 0 ? 'Restock required' : 'Optimal levels'}
          icon={<AlertTriangle className="h-4 w-4" />}
          accentColor="rose"
          href="/inventory"
          loading={loading}
          className={lowStockAlertsCount > 0 ? 'ring-1 ring-rose-500/50' : ''}
        />
      </div>

      {/* Active Orders Widget - Full Width on Mobile, Part of Grid on Desktop */}
      <div className="px-1 sm:px-0">
        <ActiveOrdersWidget outletId={outletId} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-1 sm:px-0">
        <SalesTrendChart />
        <PaymentBreakdownChart />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-1 sm:px-0">
        <PeakHoursChart />
        <div className="space-y-4 sm:space-y-6">
          <TopItemsList />
          <StaffPerformanceList />
        </div>
      </div>
    </div>
  );
}
