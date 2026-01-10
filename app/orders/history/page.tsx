import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { OrderHistoryPageClient } from '@/components/orders/OrderHistoryPageClient';

// Route segment config for optimal performance
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds (history changes less frequently)

export default async function OrderHistoryPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  // Optimize query - select only needed fields
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_type,
      status,
      total,
      payment_method,
      created_at,
      table_id,
      user_id,
      order_items (
        id,
        quantity,
        price,
        item_id,
        items (
          id,
          name
        )
      ),
      tables (
        id,
        name
      ),
      users (
        id,
        name,
        email
      )
    `)
    .eq('outlet_id', effectiveOutletId)
    .in('status', ['COMPLETED', 'CANCELLED'])
    .order('created_at', { ascending: false })
    .limit(1000);

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('outlet_id', effectiveOutletId)
    .order('name', { ascending: true });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        <p className="text-red-600">Error loading orders: {error.message}</p>
      </div>
    );
  }

  return (
    <OrderHistoryPageClient
      initialOrders={orders || []}
      tables={tables || []}
      outletId={effectiveOutletId}
    />
  );
}

