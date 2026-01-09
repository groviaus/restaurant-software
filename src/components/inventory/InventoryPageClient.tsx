'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryTable } from '@/components/tables/InventoryTable';
import { Inventory, InventoryLog } from '@/lib/types';
import { useRealtimeInventory } from '@/hooks/useRealtime';

interface InventoryPageClientProps {
  initialInventory: Inventory[];
  initialLogs: InventoryLog[];
  initialLowStockAlerts: Inventory[];
  outletId: string;
}

export function InventoryPageClient({
  initialInventory,
  initialLogs,
  initialLowStockAlerts,
  outletId,
}: InventoryPageClientProps) {
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory[]>(initialInventory);
  const [logs, setLogs] = useState<InventoryLog[]>(initialLogs);
  const [lowStockAlerts, setLowStockAlerts] = useState<Inventory[]>(initialLowStockAlerts);

  // Update state when props change (e.g., from server refresh)
  useEffect(() => {
    setInventory(initialInventory);
    setLogs(initialLogs);
    setLowStockAlerts(initialLowStockAlerts);
  }, [initialInventory, initialLogs, initialLowStockAlerts]);

  // Function to refetch inventory data
  const refetchInventory = useCallback(async () => {
    try {
      console.log('[InventoryPageClient] Refetching inventory data...');
      router.refresh();
    } catch (error) {
      console.error('[InventoryPageClient] Failed to refetch inventory:', error);
    }
  }, [router]);

  // Subscribe to real-time inventory changes
  useRealtimeInventory({
    outletId,
    onChange: (payload) => {
      console.log('[InventoryPageClient] Realtime inventory change received:', payload.eventType);
      refetchInventory();
    },
    onInsert: (payload) => {
      console.log('[InventoryPageClient] New inventory item inserted');
      refetchInventory();
    },
    onUpdate: (payload) => {
      console.log('[InventoryPageClient] Inventory item updated');
      refetchInventory();
    },
  });

  // Recalculate low stock alerts when inventory changes
  useEffect(() => {
    const alerts = inventory.filter(
      (inv) => inv.stock <= inv.low_stock_threshold
    );
    setLowStockAlerts(alerts);
  }, [inventory]);

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
      />
    </div>
  );
}

