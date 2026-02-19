import { getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { OrdersPageClient } from '@/components/orders/OrdersPageClient';

// Route segment config for optimal performance
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

export default async function OrdersPage() {
  await requirePermission('orders', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  // Render shell immediately; OrdersPageClient fetches data on the client
  return <OrdersPageClient outletId={effectiveOutletId} />;
}

