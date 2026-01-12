'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeOrders, useRealtimeInventory } from '@/hooks/useRealtime';
import { SalesTrendChart } from '@/components/charts/SalesTrendChart';
import { PaymentBreakdownChart } from '@/components/charts/PaymentBreakdownChart';
import { PeakHoursChart } from '@/components/charts/PeakHoursChart';
import { TopItemsList } from '@/components/charts/TopItemsList';
import { StaffPerformanceList } from '@/components/charts/StaffPerformanceList';
import { AlertTriangle, Package, DollarSign, ShoppingCart } from 'lucide-react';
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
        const sales = todayOrders.reduce((sum, order: any) => {
          return sum + (order.status === 'COMPLETED' ? (Number(order.total) || 0) : 0);
        }, 0);
        const orders = todayOrders.length;
        const completed = todayOrders.filter((o: any) => o.status === 'COMPLETED').length;

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
        topItemsData.forEach((order: any) => {
          order.order_items?.forEach((oi: any) => {
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
          inventoryData.filter((inv: any) => inv.stock <= inv.low_stock_threshold).length
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
    onInsert: (payload) => {
      console.log('[Dashboard] New order inserted');
      refetchDashboard();
    },
    onUpdate: (payload) => {
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
    onInsert: (payload) => {
      console.log('[Dashboard] New inventory item inserted');
      refetchDashboard();
    },
    onUpdate: (payload) => {
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
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Overview of your restaurant operations</p>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="px-4 sm:px-0">
          <AlertBanner alerts={alerts} />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 px-4 sm:px-0">
        <MetricCard
          title="Today's Sales"
          value={`₹${totalSales.toFixed(2)}`}
          subtitle={`${completedOrders} completed orders`}
          icon={<DollarSign className="h-4 w-4" />}
          href="/orders"
          loading={loading}
        />

        <MetricCard
          title="Today's Orders"
          value={totalOrders}
          subtitle="Total orders today"
          icon={<ShoppingCart className="h-4 w-4" />}
          href="/orders"
          loading={loading}
        />

        <MetricCard
          title="Top Item"
          value={topItem}
          subtitle="Best selling item today"
          href="/menu"
          loading={loading}
          className="col-span-2 sm:col-span-1"
        />

        <MetricCard
          title="Inventory Items"
          value={totalInventoryItems}
          subtitle="Total tracked items"
          icon={<Package className="h-4 w-4" />}
          href="/inventory"
          loading={loading}
        />

        <MetricCard
          title="Low Stock Alerts"
          value={lowStockAlertsCount}
          subtitle={lowStockAlertsCount > 0 ? 'Items need restocking' : 'All items in stock'}
          icon={<AlertTriangle className="h-4 w-4" />}
          href="/inventory"
          loading={loading}
          className={lowStockAlertsCount > 0 ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
        />
      </div>

      {/* Active Orders Widget - Full Width on Mobile, Part of Grid on Desktop */}
      <div className="px-4 sm:px-0">
        <ActiveOrdersWidget outletId={outletId} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-4 sm:px-0">
        <SalesTrendChart />
        <PaymentBreakdownChart />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-4 sm:px-0">
        <PeakHoursChart />
        <div className="space-y-4 sm:space-y-6">
          <TopItemsList />
          <StaffPerformanceList />
        </div>
      </div>
    </div>
  );
}

