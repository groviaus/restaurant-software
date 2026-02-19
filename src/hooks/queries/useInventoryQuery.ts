import { useQuery } from '@tanstack/react-query';
import type { Inventory, InventoryLog } from '@/lib/types';

async function fetchInventory(outletId: string): Promise<Inventory[]> {
  const res = await fetch(`/api/inventory?outlet_id=${outletId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch inventory');
  }
  const data = await res.json();
  const list = data?.inventory ?? data;
  return Array.isArray(list) ? list : [];
}

export function inventoryQueryKey(outletId: string) {
  return ['inventory', outletId] as const;
}

export function useInventoryItemsQuery(outletId: string) {
  return useQuery({
    queryKey: inventoryQueryKey(outletId),
    queryFn: () => fetchInventory(outletId),
    enabled: !!outletId,
  });
}

async function fetchInventoryLogs(outletId: string): Promise<InventoryLog[]> {
  const res = await fetch(`/api/inventory/logs?outlet_id=${outletId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch inventory logs');
  }
  const data = await res.json();
  return Array.isArray(data?.logs) ? data.logs : [];
}

export function inventoryLogsQueryKey(outletId: string) {
  return ['inventory', 'logs', outletId] as const;
}

export function useInventoryLogsQuery(outletId: string) {
  return useQuery({
    queryKey: inventoryLogsQueryKey(outletId),
    queryFn: () => fetchInventoryLogs(outletId),
    enabled: !!outletId,
  });
}
