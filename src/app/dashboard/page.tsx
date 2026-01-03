import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage() {
  await requireAuth();
  const supabase = await createClient();

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch today's sales
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total, status')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString());

  const totalSales = todayOrders?.reduce((sum, order: any) => {
    return sum + (order.status === 'COMPLETED' ? Number(order.total) : 0);
  }, 0) || 0;

  const totalOrders = todayOrders?.length || 0;
  const completedOrders = todayOrders?.filter((o: any) => o.status === 'COMPLETED').length || 0;

  // Get top selling item (placeholder for now)
  const topItem = 'N/A';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Overview of your restaurant operations</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Today&apos;s Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {completedOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Today&apos;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total orders today</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Top Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{topItem}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Best selling item</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-gray-600">Chart placeholder - to be implemented in Phase 3</p>
        </CardContent>
      </Card>
    </div>
  );
}

