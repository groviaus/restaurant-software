import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUser, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  // Enforce permission check for dashboard
  await requirePermission('dashboard', 'view');

  const user = await getUser();
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);

  if (!user || !effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600">
          {!user
            ? 'Please log in to view the dashboard.'
            : 'Please contact an administrator to assign you to an outlet.'}
        </p>
      </div>
    );
  }

  // Get today's date range - use local date boundaries
  // Create date range in local timezone, then convert to ISO for database query
  const now = new Date();
  const localYear = now.getFullYear();
  const localMonth = now.getMonth();
  const localDate = now.getDate();

  // Start of today in local timezone
  const todayStart = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
  // End of today in local timezone (start of tomorrow)
  const todayEnd = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:28', message: 'Date range calculation', data: { todayLocal: todayStart.toString(), todayISO: todayStart.toISOString(), todayEndISO: todayEnd.toISOString(), outletId: effectiveOutletId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'A' }) }).catch(() => { });
  // #endregion

  // Fetch today's sales with error handling
  const serviceClient = createServiceRoleClient();
  let totalSales = 0;
  let totalOrders = 0;
  let completedOrders = 0;
  let topItem = 'N/A';
  let lowStockAlertsCount = 0;
  let totalInventoryItems = 0;

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:42', message: 'Before orders query', data: { outletId: effectiveOutletId, dateFrom: todayStart.toISOString(), dateTo: todayEnd.toISOString() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion

    const { data: todayOrders, error: ordersError } = await serviceClient
      .from('orders')
      .select('total, status, created_at')
      .eq('outlet_id', effectiveOutletId)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:50', message: 'Orders query result', data: { hasError: !!ordersError, error: ordersError?.message || null, ordersCount: todayOrders?.length || 0, orders: todayOrders?.map((o: any) => ({ total: o.total, status: o.status, created_at: o.created_at })) || [], allStatuses: todayOrders?.map((o: any) => o.status) || [] }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
    // #endregion

    if (ordersError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:52', message: 'Orders query error', data: { error: ordersError.message, code: ordersError.code, details: ordersError }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
      // #endregion
      console.error('Error fetching today\'s orders:', ordersError);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:56', message: 'Calculating totals', data: { ordersCount: todayOrders?.length || 0, completedCount: todayOrders?.filter((o: any) => o.status === 'COMPLETED').length || 0, allStatuses: todayOrders?.map((o: any) => o.status) || [] }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
      // #endregion

      totalSales = todayOrders?.reduce((sum, order: any) => {
        return sum + (order.status === 'COMPLETED' ? Number(order.total) : 0);
      }, 0) || 0;

      totalOrders = todayOrders?.length || 0;
      completedOrders = todayOrders?.filter((o: any) => o.status === 'COMPLETED').length || 0;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:63', message: 'Totals calculated', data: { totalSales, totalOrders, completedOrders }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
      // #endregion
    }

    // Get top selling item with error handling
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:68', message: 'Before top items query', data: { outletId: effectiveOutletId, dateFrom: todayStart.toISOString(), dateTo: todayEnd.toISOString() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:85', message: 'Top items query result', data: { hasError: !!topItemsError, error: topItemsError?.message || null, ordersCount: topItemsData?.length || 0, ordersWithItems: topItemsData?.filter((o: any) => o.order_items?.length > 0).length || 0 }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
    // #endregion

    if (topItemsError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:90', message: 'Top items query error', data: { error: topItemsError.message, code: topItemsError.code, details: topItemsError }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
      // #endregion
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:105', message: 'Top item calculation', data: { itemCountsSize: itemCounts.size, topItem: itemCounts.size > 0 ? Array.from(itemCounts.values()).sort((a: any, b: any) => b.count - a.count)[0].name : 'N/A' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
      // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:113', message: 'Catch block error', data: { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
    // #endregion
    console.error('Error fetching dashboard data:', error);
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/dashboard/page.tsx:118', message: 'Final values before render', data: { totalSales, totalOrders, completedOrders, topItem }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
  // #endregion

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
