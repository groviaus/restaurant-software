import { useQuery } from '@tanstack/react-query';
import type { OrderWithItems } from '@/lib/types';

export interface OrdersQueryParams {
  outlet_id: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

async function fetchOrders(params: OrdersQueryParams): Promise<OrderWithItems[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('outlet_id', params.outlet_id);
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);
  if (params.status) searchParams.set('status', params.status);
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));

  const res = await fetch(`/api/orders?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch orders');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function ordersQueryKey(outletId: string, params?: Partial<OrdersQueryParams>) {
  return ['orders', outletId, params ?? {}] as const;
}

export function useOrdersQuery(
  outletId: string,
  params?: Partial<Omit<OrdersQueryParams, 'outlet_id'>>
) {
  const queryParams: OrdersQueryParams = {
    outlet_id: outletId,
    limit: 50,
    ...params,
  };
  return useQuery({
    queryKey: ordersQueryKey(outletId, queryParams),
    queryFn: () => fetchOrders(queryParams),
    enabled: !!outletId,
  });
}

export function useOrderQuery(orderId: string | null) {
  return useQuery({
    queryKey: ['orders', orderId] as const,
    queryFn: async () => {
      if (!orderId) return null;
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch order');
      }
      return res.json();
    },
    enabled: !!orderId,
  });
}

export interface OrderHistoryQueryParams {
  outlet_id: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

async function fetchOrderHistory(params: OrderHistoryQueryParams): Promise<OrderWithItems[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('outlet_id', params.outlet_id);
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);
  if (params.status) searchParams.set('status', params.status);
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));

  const res = await fetch(`/api/orders?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch order history');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function orderHistoryQueryKey(outletId: string, params?: Partial<OrderHistoryQueryParams>) {
  return ['orders', 'history', outletId, params ?? {}] as const;
}

export function useOrderHistoryQuery(
  outletId: string,
  params?: Partial<Omit<OrderHistoryQueryParams, 'outlet_id'>>
) {
  const queryParams: OrderHistoryQueryParams = {
    outlet_id: outletId,
    status: 'COMPLETED,CANCELLED',
    limit: 1000,
    ...params,
  };
  return useQuery({
    queryKey: orderHistoryQueryKey(outletId, queryParams),
    queryFn: () => fetchOrderHistory(queryParams),
    enabled: !!outletId,
  });
}
