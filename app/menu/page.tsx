import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { MenuTable } from '@/components/tables/MenuTable';

export default async function MenuPage() {
  await requirePermission('menu', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('outlet_id', effectiveOutletId)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
        <p className="text-red-600">Error loading menu items: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-600">Manage your restaurant menu items</p>
      </div>
      <MenuTable items={items || []} outletId={effectiveOutletId} />
    </div>
  );
}

