import { useQuery } from '@tanstack/react-query';
import type { Inventory, InventoryLog, InventoryItem, InventoryMovement, Recipe, InventoryAvailability } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Legacy hooks (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// New production hooks
// ─────────────────────────────────────────────────────────────────────────────

async function fetchInventoryItemsList(): Promise<InventoryItem[]> {
  const res = await fetch(`/api/inventory/items`);
  if (!res.ok) throw new Error('Failed to fetch inventory items');
  const data = await res.json();
  return data.items ?? [];
}

export function inventoryItemsQueryKey() {
  return ['inventory_items'] as const;
}

export function useInventoryItemsList() {
  return useQuery({
    queryKey: inventoryItemsQueryKey(),
    queryFn: fetchInventoryItemsList,
    staleTime: 30_000,
  });
}

async function fetchInventoryMovements(limit = 100): Promise<InventoryMovement[]> {
  const res = await fetch(`/api/inventory/movements?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch inventory movements');
  const data = await res.json();
  return data.movements ?? [];
}

export function inventoryMovementsQueryKey(limit?: number) {
  return ['inventory_movements', limit] as const;
}

export function useInventoryMovementsQuery(limit = 100) {
  return useQuery({
    queryKey: inventoryMovementsQueryKey(limit),
    queryFn: () => fetchInventoryMovements(limit),
    staleTime: 10_000,
  });
}

async function fetchRecipes(): Promise<Recipe[]> {
  const res = await fetch(`/api/inventory/recipes`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  const data = await res.json();
  return data.recipes ?? [];
}

export function recipesQueryKey() {
  return ['inventory_recipes'] as const;
}

export function useRecipesQuery() {
  return useQuery({
    queryKey: recipesQueryKey(),
    queryFn: fetchRecipes,
    staleTime: 60_000,
  });
}

/**
 * Fetch availability for a list of menu item IDs.
 * Returns a map of menuItemId → InventoryAvailability.
 */
async function fetchAvailability(
  menuItemIds: string[]
): Promise<Record<string, InventoryAvailability>> {
  if (!menuItemIds.length) return {};
  const ids = menuItemIds.join(',');
  const res = await fetch(`/api/inventory/availability?menu_item_ids=${ids}`);
  if (!res.ok) throw new Error('Failed to fetch availability');
  const data = await res.json();
  return data.availability ?? {};
}

export function availabilityQueryKey(menuItemIds: string[]) {
  return ['inventory_availability', menuItemIds.sort().join(',')] as const;
}

export function useInventoryAvailability(menuItemIds: string[]) {
  return useQuery({
    queryKey: availabilityQueryKey(menuItemIds),
    queryFn: () => fetchAvailability(menuItemIds),
    enabled: menuItemIds.length > 0,
    staleTime: 15_000, // refresh every 15s — availability changes when stock changes
    refetchInterval: 30_000,
  });
}
