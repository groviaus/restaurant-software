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
  const [totalSales, setTotalSales] = useState(initialTotalSales);
  const [totalOrders, setTotalOrders] = useState(initialTotalOrders);
  const [completedOrders, setCompletedOrders] = useState(initialCompletedOrders);
  const [topItem, setTopItem] = useState(initialTopItem);
  const [lowStockAlertsCount, setLowStockAlertsCount] = useState(initialLowStockAlertsCount);
  const [totalInventoryItems, setTotalInventoryItems] = useState(initialTotalInventoryItems);

  // Function to refetch dashboard data
  const refetchDashboard = useCallback(async () => {
    try {
      console.log('[Dashboard] Refetching dashboard data...');
      router.refresh();
    } catch (error) {
      console.error('[Dashboard] Failed to refetch dashboard:', error);
    }
  }, [router]);

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

