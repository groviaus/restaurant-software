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
import { AlertTriangle, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useOutlet } from '@/hooks/useOutlet';

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
      
      // Get today's date range
      const now = new Date();
      const localYear = now.getFullYear();
      const localMonth = now.getMonth();
      const localDate = now.getDate();
      const todayStart = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
      const todayEnd = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);

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
          return sum + (order.status === 'COMPLETED' ? Number(order.total) : 0);
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

  // Client-side fetch fallback: if initial values are 0 and we have an outlet ID, fetch client-side
  // This is important for Capacitor apps where server-side cookies might not work
  useEffect(() => {
    const effectiveOutletId = currentOutletId || outletId;
    if (effectiveOutletId && profile && (initialTotalSales === 0 && initialTotalOrders === 0)) {
      console.log('[Dashboard] Initial values are 0, fetching client-side data...');
      fetchDashboardData();
    }
  }, [currentOutletId, outletId, profile, initialTotalSales, initialTotalOrders, fetchDashboardData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your restaurant operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">
              {completedOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-sm text-gray-600 mt-1">Total orders today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{topItem}</div>
            <p className="text-sm text-gray-600 mt-1">Best selling item today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInventoryItems}</div>
            <p className="text-sm text-gray-600 mt-1">Total tracked items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {lowStockAlertsCount > 0 ? (
                <Badge variant="destructive" className="text-2xl px-3 py-1">
                  {lowStockAlertsCount}
                </Badge>
              ) : (
                <span className="text-green-600">0</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {lowStockAlertsCount > 0 ? 'Items need restocking' : 'All items in stock'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SalesTrendChart />
        <PaymentBreakdownChart />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PeakHoursChart />
        <div className="space-y-6">
          <TopItemsList />
          <StaffPerformanceList />
        </div>
      </div>
    </div>
  );
}

