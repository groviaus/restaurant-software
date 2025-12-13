import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { MenuTable } from '@/components/tables/MenuTable';

export default async function MenuPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const supabase = await createClient();

  if (!profile?.outlet_id) {
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
    .eq('outlet_id', profile.outlet_id)
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
      <MenuTable items={items || []} outletId={profile.outlet_id} />
    </div>
  );
}

