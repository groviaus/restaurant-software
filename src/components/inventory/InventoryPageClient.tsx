'use client';

import { useMemo } from 'react';
import { InventoryTable } from '@/components/tables/InventoryTable';
import { useRealtimeInventory } from '@/hooks/useRealtime';
import { useInventoryItemsQuery, useInventoryLogsQuery } from '@/hooks/queries/useInventoryQuery';

interface InventoryPageClientProps {
  outletId: string;
}

export function InventoryPageClient({ outletId }: InventoryPageClientProps) {
  const inventoryQuery = useInventoryItemsQuery(outletId);
  const logsQuery = useInventoryLogsQuery(outletId);

  const inventory = inventoryQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  const lowStockAlerts = useMemo(
    () => inventory.filter((inv) => inv.stock <= inv.low_stock_threshold),
    [inventory]
  );

  useRealtimeInventory({
    outletId,
    onChange: () => {
      inventoryQuery.refetch();
      logsQuery.refetch();
    },
    onInsert: () => {
      inventoryQuery.refetch();
      logsQuery.refetch();
    },
    onUpdate: () => {
      inventoryQuery.refetch();
      logsQuery.refetch();
    },
  });

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
            {lowStockAlerts.slice(0, 5).map((alert) => (
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
        inventory={inventory}
        logs={logs}
        outletId={outletId}
        onRefetchInventory={inventoryQuery.refetch}
      />
    </div>
  );
}
