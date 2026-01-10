import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId, requirePermission } from '@/lib/auth';
import { TableGrid } from '@/components/tables/TableGrid';
import { Table } from '@/lib/types';

export default async function TablesPage() {
  await requirePermission('tables', 'view');
  const profile = await getUserProfile();
  const effectiveOutletId = getEffectiveOutletId(profile);
  const supabase = await createClient();

  if (!effectiveOutletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Table Management</h1>
        <p className="text-gray-600">Please contact an administrator to assign you to an outlet.</p>
      </div>
    );
  }

  const { data: tables, error } = await supabase
    .from('tables')
    .select('*')
    .eq('outlet_id', effectiveOutletId)
    .order('name', { ascending: true });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Table Management</h1>
        <p className="text-red-600">Error loading tables: {error.message}</p>
      </div>
    );
  }

  // Fetch active orders for occupied tables to show order info
  const typedTables: Table[] = (tables || []) as Table[];
  const occupiedTableIds = typedTables
    .filter(t => t.status === 'OCCUPIED')
    .map(t => t.id);

  let activeOrders: any[] = [];
  if (occupiedTableIds.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        table_id,
        status,
        total,
        created_at,
        order_items (
          id,
          quantity,
          items (
            name
          )
        )
      `)
      .in('table_id', occupiedTableIds)
      .in('status', ['NEW', 'PREPARING', 'READY', 'SERVED'])
      .eq('order_type', 'DINE_IN')
      .order('created_at', { ascending: false });
    
    activeOrders = orders || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
        <p className="text-gray-600">Manage your restaurant tables</p>
      </div>
      <TableGrid 
        tables={typedTables} 
        outletId={effectiveOutletId}
        activeOrders={activeOrders}
      />
    </div>
  );
}

