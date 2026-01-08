import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { InventoryTable } from '@/components/tables/InventoryTable';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Track stock levels and manage inventory</p>
      </div>
      {lowStockAlerts.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="font-semibold text-yellow-800 mb-2">
            Low Stock Alerts ({lowStockAlerts.length})
          </h2>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {lowStockAlerts.slice(0, 5).map((alert: any) => (
              <li key={alert.id}>
                {alert.item?.name}: {alert.stock} units (threshold: {alert.low_stock_threshold})
              </li>
            ))}
            {lowStockAlerts.length > 5 && (
              <li className="font-medium">...and {lowStockAlerts.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
      <InventoryTable
        inventory={inventory || []}
        logs={logs || []}
        outletId={effectiveOutletId}
      />
    </div>
  );
}

