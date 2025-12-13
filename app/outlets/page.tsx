import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { OutletsTable } from '@/components/tables/OutletsTable';

export default async function OutletsPage() {
  await requireAuth();
  const profile = await getUserProfile();
  const supabase = await createClient();

  if (!profile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Outlets</h1>
        <p className="text-gray-600">Please log in to view outlets.</p>
      </div>
    );
  }

  // Admins can see all outlets, others see only their outlet
  let query = supabase.from('outlets').select('*');
  
  if (profile.role !== 'admin' && profile.outlet_id) {
    query = query.eq('id', profile.outlet_id);
  }

  const { data: outlets, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Outlets</h1>
        <p className="text-red-600">Error loading outlets: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Outlets Management</h1>
        <p className="text-gray-600">
          {profile.role === 'admin'
            ? 'Manage all restaurant outlets'
            : 'View your outlet information'}
        </p>
      </div>
      <OutletsTable outlets={outlets || []} userRole={profile.role} />
    </div>
  );
}

