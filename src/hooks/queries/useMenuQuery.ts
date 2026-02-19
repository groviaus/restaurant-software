import { useQuery } from '@tanstack/react-query';
import type { MenuItem } from '@/lib/types';
import type { Category } from '@/lib/types';

export interface MenuQueryParams {
  outlet_id: string;
  category?: string;
  available?: boolean;
}

async function fetchMenuItems(params: MenuQueryParams): Promise<MenuItem[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('outlet_id', params.outlet_id);
  if (params.category) searchParams.set('category', params.category);
  if (params.available !== undefined) searchParams.set('available', String(params.available));

  const res = await fetch(`/api/menu?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch menu items');
  }
  const data = await res.json();
  const items = data?.items ?? data;
  return Array.isArray(items) ? items : [];
}

export function menuQueryKey(outletId: string, params?: Partial<MenuQueryParams>) {
  return ['menu', outletId, params ?? {}] as const;
}

export function useMenuItemsQuery(
  outletId: string,
  params?: Partial<Omit<MenuQueryParams, 'outlet_id'>>
) {
  const queryParams: MenuQueryParams = {
    outlet_id: outletId,
    ...params,
  };
  return useQuery({
    queryKey: menuQueryKey(outletId, queryParams),
    queryFn: () => fetchMenuItems(queryParams),
    enabled: !!outletId,
  });
}

async function fetchCategories(outletId: string): Promise<Category[]> {
  const res = await fetch(`/api/categories?outlet_id=${outletId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch categories');
  }
  const data = await res.json();
  const categories = data?.categories ?? data;
  return Array.isArray(categories) ? categories : [];
}

export function categoriesQueryKey(outletId: string) {
  return ['categories', outletId] as const;
}

export function useCategoriesQuery(outletId: string) {
  return useQuery({
    queryKey: categoriesQueryKey(outletId),
    queryFn: () => fetchCategories(outletId),
    enabled: !!outletId,
  });
}
