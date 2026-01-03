import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { TableGrid } from '@/components/tables/TableGrid';

export default async function TablesPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const supabase = await createClient();

  if (!profile?.outlet_id) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Table Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  const { data: tables, error } = await supabase
    .from('tables')
    .select('*')
    .eq('outlet_id', profile.outlet_id)
    .order('name', { ascending: true });

  if (error) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Table Management</h1>
        <p className="text-sm sm:text-base text-red-600">Error loading tables: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Table Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your restaurant tables</p>
      </div>
      <TableGrid tables={tables || []} outletId={profile.outlet_id} onRefresh={async () => { }} />
    </div>
  );
}

