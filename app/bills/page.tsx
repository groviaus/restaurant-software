import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { BillsTable } from '@/components/tables/BillsTable';

export default async function BillsPage() {
  await requirePermission('bills', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bills</h1>
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
    .eq('outlet_id', effectiveOutletId)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bills</h1>
        <p className="text-red-600">Error loading bills: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
        <p className="text-gray-600">View and manage all bills and receipts</p>
      </div>
      <BillsTable bills={orders || []} outletId={effectiveOutletId} />
    </div>
  );
}






