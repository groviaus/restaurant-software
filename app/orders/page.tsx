import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { OrdersTable } from '@/components/tables/OrdersTable';
import { OrderForm } from '@/components/forms/OrderForm';
import { Suspense } from 'react';

// Route segment config for optimal performance
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

export default async function OrdersPage() {
  await requirePermission('orders', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
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
      subtotal,
      tax,
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
        quantity_type,
        notes,
        items (
          id,
          name,
          price
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
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .eq('outlet_id', effectiveOutletId)
    .order('name', { ascending: true });

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
      <OrdersTable
        orders={orders || []}
        outletId={effectiveOutletId}
        tables={tables || []}
      />
    </div>
  );
}

