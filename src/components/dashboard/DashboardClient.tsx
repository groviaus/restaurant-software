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
  initialTotalSales?: number;
  initialTotalOrders?: number;
  initialCompletedOrders?: number;
  initialTopItem?: string;
  initialLowStockAlertsCount?: number;
  initialTotalInventoryItems?: number;
  outletId?: string;
}

interface DashboardSummaryCache {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  topItem: string;
  lowStockAlertsCount: number;
  totalInventoryItems: number;
  timestamp: number;
}
const dashboardSummaryCache: Record<string, DashboardSummaryCache> = {};

export function DashboardClient({
  initialTotalSales,
  initialTotalOrders,
  initialCompletedOrders,
  initialTopItem,
  initialLowStockAlertsCount,
  initialTotalInventoryItems,
  outletId,
}: DashboardClientProps = {}) {
  const router = useRouter();
  const { profile } = useAuth();
  const { currentOutletId } = useOutlet();
  const effectiveOutletId = currentOutletId || outletId || profile?.outlet_id || '';
  const cached = effectiveOutletId ? dashboardSummaryCache[effectiveOutletId] : null;

  const [totalSales, setTotalSales] = useState(cached?.totalSales ?? initialTotalSales ?? 0);
  const [totalOrders, setTotalOrders] = useState(cached?.totalOrders ?? initialTotalOrders ?? 0);
  const [completedOrders, setCompletedOrders] = useState(cached?.completedOrders ?? initialCompletedOrders ?? 0);
  const [topItem, setTopItem] = useState(cached?.topItem ?? initialTopItem ?? 'N/A');
  const [lowStockAlertsCount, setLowStockAlertsCount] = useState(cached?.lowStockAlertsCount ?? initialLowStockAlertsCount ?? 0);
  const [totalInventoryItems, setTotalInventoryItems] = useState(cached?.totalInventoryItems ?? initialTotalInventoryItems ?? 0);
  const [loading, setLoading] = useState(!cached && initialTotalSales === undefined);

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

      let sales = 0;
      let orders = 0;
      let completed = 0;
      let top = 'N/A';

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
        sales = todayOrders.reduce((sum, order: { status: string; total: number | string }) => {
          return sum + (order.status === 'COMPLETED' ? (Number(order.total) || 0) : 0);
        }, 0);
        orders = todayOrders.length;
        completed = todayOrders.filter((o: { status: string }) => o.status === 'COMPLETED').length;

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
          top = Array.from(itemCounts.values()).sort((a, b) => b.count - a.count)[0].name;
          setTopItem(top);
        }
      }

      // Fetch inventory summary (new engine first, fallback to legacy)
      const { data: newInvData, error: newInvErr } = await supabase
        .from('inventory_items')
        .select('current_stock, min_stock')
        .eq('outlet_id', effectiveOutletId)
        .eq('is_active', true);

      let lowStockCount = 0;
      let totalInventory = 0;

      if (!newInvErr && newInvData && newInvData.length > 0) {
        totalInventory = newInvData.length;
        lowStockCount = newInvData.filter((item: any) => item.min_stock !== null && Number(item.current_stock) <= Number(item.min_stock)).length;
      } else {
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('stock, low_stock_threshold')
          .eq('outlet_id', effectiveOutletId);

        if (inventoryData) {
          totalInventory = inventoryData.length;
          lowStockCount = inventoryData.filter((inv: { stock: number; low_stock_threshold: number }) => inv.stock <= inv.low_stock_threshold).length;
        }
      }

      setTotalInventoryItems(totalInventory);
      setLowStockAlertsCount(lowStockCount);

      // Cache the fetched metrics for instant transitions
      dashboardSummaryCache[effectiveOutletId] = {
        totalSales: sales,
        totalOrders: orders,
        completedOrders: completed,
        topItem: top,
        lowStockAlertsCount: lowStockCount,
        totalInventoryItems: totalInventory,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[Dashboard] Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveOutletId]);

  // Initial fetch on mount or when outlet changes
  useEffect(() => {
    if (effectiveOutletId) {
      fetchDashboardData();
    }
  }, [effectiveOutletId, fetchDashboardData]);

  // Function to refetch dashboard data
  const refetchDashboard = useCallback(async () => {
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('[Dashboard] Failed to refetch dashboard:', error);
    }
  }, [fetchDashboardData]);

  // Subscribe to real-time order changes
  useRealtimeOrders({
    outletId: effectiveOutletId,
    onChange: (payload) => {
      console.log('[Dashboard] Realtime order change received:', payload.eventType);
      refetchDashboard();
    },
    onInsert: () => {
      refetchDashboard();
    },
    onUpdate: () => {
      refetchDashboard();
    },
  });

  // Subscribe to real-time inventory changes
  useRealtimeInventory({
    outletId: effectiveOutletId,
    onChange: (payload) => {
      console.log('[Dashboard] Realtime inventory change received:', payload.eventType);
      refetchDashboard();
    },
    onInsert: () => {
      refetchDashboard();
    },
    onUpdate: () => {
      refetchDashboard();
    },
  });

  // Update state when initial props change (if provided)
  useEffect(() => {
    if (initialTotalSales !== undefined) setTotalSales(initialTotalSales);
    if (initialTotalOrders !== undefined) setTotalOrders(initialTotalOrders);
    if (initialCompletedOrders !== undefined) setCompletedOrders(initialCompletedOrders);
    if (initialTopItem !== undefined) setTopItem(initialTopItem);
    if (initialLowStockAlertsCount !== undefined) setLowStockAlertsCount(initialLowStockAlertsCount);
    if (initialTotalInventoryItems !== undefined) setTotalInventoryItems(initialTotalInventoryItems);
  }, [initialTotalSales, initialTotalOrders, initialCompletedOrders, initialTopItem, initialLowStockAlertsCount, initialTotalInventoryItems]);

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
        <ActiveOrdersWidget outletId={effectiveOutletId} />
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
