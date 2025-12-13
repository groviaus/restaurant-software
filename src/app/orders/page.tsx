import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { OrdersTable } from '@/components/tables/OrdersTable';

export default async function OrdersPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const supabase = await createClient();

  if (!profile?.outlet_id) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  const { data: orders, error } = await supabase
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
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <p className="text-red-600">Error loading orders: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage and track orders</p>
      </div>
      <OrdersTable orders={orders || []} outletId={profile.outlet_id} />
    </div>
  );
}

