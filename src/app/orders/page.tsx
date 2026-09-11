import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { OrdersTable } from '@/components/tables/OrdersTable';

export default async function OrdersPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const supabase = await createClient();

  if (!profile?.outlet_id) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Orders</h1>
        <p className="text-sm sm:text-base text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  // Calculate today's date range (00:00:00 to 23:59:59)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayEnd = tomorrow.toISOString();

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        items (*)
      ),
      tables (*),
      users (*)
    `)
    .eq('outlet_id', profile.outlet_id)
    .gte('created_at', todayStart)
    .lt('created_at', todayEnd)
    .order('created_at', { ascending: false });

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('outlet_id', profile.outlet_id)
    .order('name', { ascending: true });

  if (ordersError) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Orders</h1>
        <p className="text-sm sm:text-base text-red-600">Error loading orders: {ordersError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Orders</h1>
      </div>
      <OrdersTable
        orders={orders || []}
        outletId={profile.outlet_id}
        tables={tables || []}
      />
    </div>
  );
}

