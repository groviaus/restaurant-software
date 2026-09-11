import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

import { Store } from 'lucide-react';

// Route segment config for optimal performance
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

export default async function DashboardPage() {
  // Enforce permission check for dashboard
  await requirePermission('dashboard', 'view');

  const user = await getUser();
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);

  if (!user || !effectiveOutletId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-xs max-w-md w-full">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {!user ? 'Authentication Required' : 'Outlet Not Assigned'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {!user
              ? 'Please log in with valid credentials to access the restaurant operations dashboard.'
              : 'Please contact a system administrator to assign your account to an active restaurant outlet.'}
          </p>
        </div>
      </div>
    );
  }

  // Get today's date range - use IST timezone (Asia/Kolkata) to match orders page behavior
  // The orders page uses local timezone (IST), so dashboard should match
  // Calculate "today" in IST, then convert to UTC for database queries
  const now = new Date();
  
  // Get current time in IST (UTC+5:30)
  // Format: "Asia/Kolkata" timezone
  // IST is UTC+5:30, so we add 5.5 hours to get IST time
  const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const nowIST = new Date(now.getTime() + istOffsetMs);
  
  // Get date components in IST
  const istYear = nowIST.getUTCFullYear();
  const istMonth = nowIST.getUTCMonth();
  const istDate = nowIST.getUTCDate();

  // Calculate start of today in IST (midnight IST)
  // Then convert back to UTC by subtracting the offset
  const todayStartIST = Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0);
  const todayStart = new Date(todayStartIST - istOffsetMs);
  
  // Calculate end of today in IST (midnight of tomorrow in IST)
  // Then convert back to UTC
  const todayEndIST = Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0);
  const todayEnd = new Date(todayEndIST - istOffsetMs);


  // Fetch today's sales with error handling
  const serviceClient = createServiceRoleClient();
  let totalSales = 0;
  let totalOrders = 0;
  let completedOrders = 0;
  let topItem = 'N/A';
  let lowStockAlertsCount = 0;
  let totalInventoryItems = 0;

  try {
    const { data: todayOrders, error: ordersError } = await serviceClient
      .from('orders')
      .select('total, status, created_at')
      .eq('outlet_id', effectiveOutletId)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    if (ordersError) {
      console.error('Error fetching today\'s orders:', ordersError);
    } else {
      totalSales = todayOrders?.reduce((sum, order: any) => {
        return sum + (order.status === 'COMPLETED' ? (Number(order.total) || 0) : 0);
      }, 0) || 0;

      totalOrders = todayOrders?.length || 0;
      completedOrders = todayOrders?.filter((o: any) => o.status === 'COMPLETED').length || 0;
    }

    // Get top selling item with error handling
    const { data: topItemsData, error: topItemsError } = await serviceClient
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

    if (topItemsError) {
      console.error('Error fetching top items:', topItemsError);
    } else {
      const itemCounts = new Map<string, { name: string; count: number }>();
      topItemsData?.forEach((order: any) => {
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
        topItem = Array.from(itemCounts.values()).sort((a, b) => b.count - a.count)[0].name;
      }
    }

    // Fetch inventory summary
    const { data: inventoryData, error: inventoryError } = await serviceClient
      .from('inventory')
      .select('stock, low_stock_threshold')
      .eq('outlet_id', effectiveOutletId);

    if (!inventoryError && inventoryData) {
      totalInventoryItems = inventoryData.length;
      lowStockAlertsCount = inventoryData.filter(
        (inv: any) => inv.stock <= inv.low_stock_threshold
      ).length;
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  return (
    <DashboardClient
      initialTotalSales={totalSales}
      initialTotalOrders={totalOrders}
      initialCompletedOrders={completedOrders}
      initialTopItem={topItem}
      initialLowStockAlertsCount={lowStockAlertsCount}
      initialTotalInventoryItems={totalInventoryItems}
      outletId={effectiveOutletId}
    />
  );
}
