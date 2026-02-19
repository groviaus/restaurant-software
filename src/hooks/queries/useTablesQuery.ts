import { useQuery } from '@tanstack/react-query';
import type { Table } from '@/lib/types';

export interface TablesQueryParams {
  outlet_id: string;
  status?: string;
}

async function fetchTables(params: TablesQueryParams): Promise<Table[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('outlet_id', params.outlet_id);
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/tables?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch tables');
  }
  const data = await res.json();
  const tables = data?.tables ?? data;
  return Array.isArray(tables) ? tables : [];
}

export function tablesQueryKey(outletId: string, params?: Partial<TablesQueryParams>) {
  return ['tables', outletId, params ?? {}] as const;
}

export function useTablesQuery(outletId: string, params?: Partial<Omit<TablesQueryParams, 'outlet_id'>>) {
  const queryParams: TablesQueryParams = {
    outlet_id: outletId,
    ...params,
  };
  return useQuery({
    queryKey: tablesQueryKey(outletId, queryParams),
    queryFn: () => fetchTables(queryParams),
    enabled: !!outletId,
  });
}
