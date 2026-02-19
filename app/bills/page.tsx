import { getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { BillsPageClient } from '@/components/billing/BillsPageClient';

export const dynamic = 'force-dynamic';

export default async function BillsPage() {
  await requirePermission('bills', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bills</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  return <BillsPageClient outletId={effectiveOutletId} />;
}
