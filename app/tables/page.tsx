import { getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { TablesPageClient } from '@/components/tables/TablesPageClient';

export const dynamic = 'force-dynamic';

export default async function TablesPage() {
  await requirePermission('tables', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Table Management</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  return <TablesPageClient outletId={effectiveOutletId} />;
}
