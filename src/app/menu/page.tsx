import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { MenuTable } from '@/components/tables/MenuTable';

export default async function MenuPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const supabase = await createClient();

  if (!profile?.outlet_id) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Menu Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Please contact an administrator to assign you to an outlet.</p>
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
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Menu Management</h1>
        <p className="text-sm sm:text-base text-red-600">Error loading menu items: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your restaurant menu items</p>
      </div>
      <MenuTable items={items || []} outletId={profile.outlet_id} onRefresh={async () => { }} />
    </div>
  );
}

