'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateOrderRequest } from '@/lib/types';
import { OrderStatus, TableStatus } from '@/lib/types';
import { useTableOrderStore } from '@/store/tableOrderStore';

type OrderWithItemsAny = Record<string, unknown> & {
  id: string;
  outlet_id: string;
  table_id?: string | null;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  order_items?: unknown[];
  tables?: unknown;
  users?: unknown;
};

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  const { addOrder, removeOrder, updateTableStatus } = useTableOrderStore();

  return useMutation({
    mutationFn: async (body: CreateOrderRequest) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.details && Array.isArray(err.details)) {
          const msg = err.details.map((d: { path?: string[]; message?: string }) => `${d.path?.join('.') || 'Field'}: ${d.message || 'Invalid'}`).join(', ');
          throw new Error(`Validation error: ${msg}`);
        }
        throw new Error(err.error || 'Failed to create order');
      }
      return res.json() as Promise<OrderWithItemsAny>;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueriesData({ queryKey: ['orders'] });
      const tempId = `temp-${Date.now()}`;
      const optimisticOrder: OrderWithItemsAny = {
        id: tempId,
        outlet_id: variables.outlet_id,
        table_id: variables.table_id ?? null,
        order_type: variables.order_type,
        status: OrderStatus.NEW,
        subtotal: 0,
        tax: 0,
        total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '',
        order_items: [],
        tables: null,
        users: null,
      };
      queryClient.setQueriesData<OrderWithItemsAny[]>(
        { queryKey: ['orders'] },
        (old) => (Array.isArray(old) ? [optimisticOrder, ...old] : old)
      );
      addOrder(optimisticOrder as any);
      if (variables.table_id && variables.order_type === 'DINE_IN') {
        updateTableStatus(variables.table_id, TableStatus.OCCUPIED);
      }
      return { previousOrders, tempId, tableId: variables.table_id, orderType: variables.order_type };
    },
    onError: (err: Error, _variables, context) => {
      // Rollback TanStack Query cache
      if (context?.previousOrders) {
        context.previousOrders.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      // Rollback Zustand store — remove ghost order + revert table status
      if (context?.tempId) {
        removeOrder(context.tempId);
      }
      toast.error(err.message || 'Failed to create order. Please try again.');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Order created successfully');
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  const { updateOrder } = useTableOrderStore();

  return useMutation({
    mutationFn: async ({ orderId, status, cancellation_reason }: { orderId: string; status: OrderStatus; cancellation_reason?: string | null }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancellation_reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update order status');
      }
      return res.json() as Promise<OrderWithItemsAny>;
    },
    onMutate: async ({ orderId, status, cancellation_reason }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueriesData({ queryKey: ['orders'] });
      queryClient.setQueriesData<OrderWithItemsAny[]>(
        { queryKey: ['orders'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((o) =>
            o.id === orderId ? { ...o, status, cancellation_reason: cancellation_reason ?? o.cancellation_reason } : o
          );
        }
      );
      for (const [, data] of queryClient.getQueriesData({ queryKey: ['orders'] })) {
        if (Array.isArray(data)) {
          const found = data.find((o: OrderWithItemsAny) => o.id === orderId);
          if (found) {
            updateOrder({ ...found, status, cancellation_reason } as any);
            break;
          }
        }
      }
      return { previousOrders };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousOrders) {
        context.previousOrders.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to update order status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Order status updated');
    },
  });
}

export function useCancelOrderMutation() {
  return useUpdateOrderStatusMutation();
}

export function useCompleteOrderMutation() {
  const queryClient = useQueryClient();
  const { updateOrder } = useTableOrderStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/complete`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to complete order');
      }
      return res.json() as Promise<OrderWithItemsAny>;
    },
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueriesData({ queryKey: ['orders'] });
      queryClient.setQueriesData<OrderWithItemsAny[]>(
        { queryKey: ['orders'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((o) => (o.id === orderId ? { ...o, status: OrderStatus.COMPLETED } : o));
        }
      );
      const queries = queryClient.getQueriesData<OrderWithItemsAny[]>({ queryKey: ['orders'] });
      for (const [, data] of queries) {
        if (Array.isArray(data)) {
          const found = data.find((o: OrderWithItemsAny) => o.id === orderId);
          if (found) {
            updateOrder({ ...found, status: OrderStatus.COMPLETED } as any);
            break;
          }
        }
      }
      return { previousOrders };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousOrders) {
        context.previousOrders.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to complete order');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Order completed');
    },
  });
}

export interface GenerateBillPayload {
  orderId: string;
  paymentMethod: string;
  optimisticBillData: {
    order_id: string;
    subtotal: number;
    tax: number;
    total: number;
    payment_method: string;
    items: unknown[];
    created_at: string;
  };
}

export function useGenerateBillMutation() {
  const queryClient = useQueryClient();
  const { markOrderBilled, updateOrder, updateTableStatus } = useTableOrderStore();

  return useMutation({
    mutationFn: async ({ orderId, paymentMethod }: GenerateBillPayload) => {
      const res = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate bill');
      }
      return res.json();
    },
    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueriesData({ queryKey: ['orders'] });

      // Capture the original order before changing it (needed for Zustand rollback)
      let originalOrder: OrderWithItemsAny | undefined;
      for (const [, data] of previousOrders) {
        if (Array.isArray(data)) {
          originalOrder = data.find((o: OrderWithItemsAny) => o.id === orderId);
          if (originalOrder) break;
        }
      }

      // Optimistically mark order as COMPLETED in cache
      queryClient.setQueriesData<OrderWithItemsAny[]>(
        { queryKey: ['orders'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((o) =>
            o.id === orderId ? { ...o, status: OrderStatus.COMPLETED } : o
          );
        }
      );

      // Update Zustand store immediately
      markOrderBilled(orderId);

      return { previousOrders, originalOrder };
    },
    onError: (err: Error, _variables, context) => {
      // Rollback TanStack Query cache
      if (context?.previousOrders) {
        context.previousOrders.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      // Rollback Zustand store — restore original order status and table status
      if (context?.originalOrder) {
        updateOrder(context.originalOrder as any);
        if (context.originalOrder.table_id && context.originalOrder.order_type === 'DINE_IN') {
          updateTableStatus(context.originalOrder.table_id as string, TableStatus.OCCUPIED);
        }
      }
      toast.error(err.message || 'Failed to generate bill. Please try again.');
    },
    onSuccess: (data) => {
      // Sync server truth after success
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (data) updateOrder(data as any);
    },
  });
}

export interface UpdateOrderItemsPayload {
  orderId: string;
  items_to_add?: { item_id: string; quantity: number; quantity_type?: string; notes?: string }[];
  items_to_remove?: string[];
  items_to_update?: { order_item_id: string; quantity?: number; notes?: string | null }[];
}

export function useUpdateOrderItemsMutation() {
  const queryClient = useQueryClient();
  const { updateOrder } = useTableOrderStore();

  return useMutation({
    mutationFn: async ({ orderId, ...payload }: UpdateOrderItemsPayload) => {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.details && Array.isArray(err.details)) {
          const msg = err.details.map((d: { path?: string[]; message?: string }) => `${d.path?.join('.')}: ${d.message}`).join(', ');
          throw new Error(`Validation error: ${msg}`);
        }
        throw new Error(err.error || 'Failed to update order');
      }
      return res.json() as Promise<OrderWithItemsAny>;
    },
    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueriesData({ queryKey: ['orders'] });
      const previousOrder = queryClient.getQueryData<OrderWithItemsAny>(['orders', orderId]);
      return { previousOrders, previousOrder, orderId };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousOrders) {
        context.previousOrders.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (context?.orderId && context?.previousOrder != null) {
        queryClient.setQueryData(['orders', context.orderId], context.previousOrder);
      }
      toast.error(err.message || 'Failed to update order');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['orders', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      updateOrder(data as any);
      toast.success('Order updated successfully');
    },
  });
}
