'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { MenuItem } from '@/lib/types';
import type { CreateMenuItemRequest, UpdateMenuItemRequest } from '@/lib/types';

type MenuItemAny = MenuItem & Record<string, unknown>;

export function useCreateMenuItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateMenuItemRequest & { outlet_id?: string; outlet_ids?: string[] }) => {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create menu item');
      }
      const data = await res.json();
      return { ...data, outlet_id: data.outlet_id || body.outlet_id || body.outlet_ids?.[0] } as MenuItemAny;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['menu'] });
      const previous = queryClient.getQueriesData({ queryKey: ['menu'] });
      const outletId = variables.outlet_id ?? variables.outlet_ids?.[0];
      if (!outletId) return { previous };
      const tempId = `temp-${Date.now()}`;
      const optimistic: MenuItemAny = {
        id: tempId,
        outlet_id: outletId,
        name: variables.name,
        description: variables.description ?? null,
        price: variables.price,
        category: variables.category ?? null,
        category_id: null,
        available: variables.available ?? true,
        image_url: variables.image_url ?? null,
        pricing_mode: 'fixed' as MenuItem['pricing_mode'],
        requires_quantity: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueriesData<MenuItemAny[]>(
        { queryKey: ['menu', outletId] },
        (old) => (Array.isArray(old) ? [optimistic, ...old] : old)
      );
      return { previous, tempId };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to create menu item');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      if (data?.outlet_id) queryClient.invalidateQueries({ queryKey: ['categories', data.outlet_id] });
      toast.success('Menu item created');
    },
  });
}

export function useUpdateMenuItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateMenuItemRequest & { id: string }) => {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update menu item');
      }
      return res.json() as Promise<MenuItemAny>;
    },
    onMutate: async ({ id, ...variables }) => {
      await queryClient.cancelQueries({ queryKey: ['menu'] });
      const previous = queryClient.getQueriesData({ queryKey: ['menu'] });
      queryClient.setQueriesData<MenuItemAny[]>(
        { queryKey: ['menu'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) =>
            item.id === id ? { ...item, ...variables, updated_at: new Date().toISOString() } : item
          );
        }
      );
      return { previous };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to update menu item');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      if (data?.outlet_id) queryClient.invalidateQueries({ queryKey: ['categories', data.outlet_id] });
      toast.success('Menu item updated');
    },
  });
}

export function useDeleteMenuItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, outletId, silent }: { id: string; outletId: string; silent?: boolean }) => {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || 'Failed to delete menu item';
        if (typeof msg === 'string' && (msg.includes('foreign key') || msg.includes('order_items'))) {
          const patchRes = await fetch(`/api/menu/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ available: false }),
          });
          if (patchRes.ok) return { softDelete: true, id, outletId, silent };
        }
        throw new Error(msg);
      }
      return { softDelete: false, id, outletId, silent };
    },
    onMutate: async ({ id, outletId }) => {
      await queryClient.cancelQueries({ queryKey: ['menu'] });
      const previous = queryClient.getQueriesData({ queryKey: ['menu', outletId] });
      queryClient.setQueriesData<MenuItemAny[]>(
        { queryKey: ['menu', outletId] },
        (old) => (Array.isArray(old) ? old.filter((item) => item.id !== id) : old)
      );
      return { previous };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to delete menu item');
    },
    onSuccess: (result, { outletId, silent }) => {
      queryClient.invalidateQueries({ queryKey: ['menu', outletId] });
      if (silent) return;
      if (result.softDelete) {
        toast.warning('Item has existing orders and was marked as unavailable instead of deleted');
      } else {
        toast.success('Menu item deleted');
      }
    },
  });
}
