import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { InventoryPageClient } from '@/components/inventory/InventoryPageClient';

export default async function InventoryPage() {
  await requirePermission('inventory', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Inventory</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  // Fetch inventory with items
  const { data: inventory, error: invError } = await supabase
    .from('inventory')
    .select(`
      *,
      item:items(*)
    `)
    .eq('outlet_id', effectiveOutletId)
    .order('created_at', { ascending: false });

  // Fetch low stock alerts
  const { data: alerts } = await supabase
    .from('inventory')
    .select(`
      *,
      item:items(*)
    `)
    .eq('outlet_id', effectiveOutletId);

  const lowStockAlerts = (alerts || []).filter(
    (inv: any) => inv.stock <= inv.low_stock_threshold
  );

  // Fetch inventory logs
  const { data: logs, error: logsError } = await supabase
    .from('inventory_logs')
    .select(`
      *,
      item:items(*)
    `)
    .eq('outlet_id', effectiveOutletId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (invError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Inventory</h1>
        <p className="text-red-600">Error loading inventory: {invError.message}</p>
      </div>
    );
  }

  return (
    <InventoryPageClient
      initialInventory={inventory || []}
      initialLogs={logs || []}
      initialLowStockAlerts={lowStockAlerts}
      outletId={effectiveOutletId}
    />
  );
}

