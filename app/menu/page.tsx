import { getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { MenuPageClient } from '@/components/tables/MenuPageClient';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  await requirePermission('menu', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-600">Manage your restaurant menu items</p>
      </div>
      <MenuPageClient outletId={effectiveOutletId} />
    </div>
  );
}
