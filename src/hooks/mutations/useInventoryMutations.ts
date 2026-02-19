'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Inventory } from '@/lib/types';

type InventoryAny = Inventory & Record<string, unknown>;

export interface UpdateInventoryPayload {
  item_id: string;
  stock: number;
  low_stock_threshold?: number;
}

export function useUpdateInventoryMutation(outletId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateInventoryPayload) => {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update inventory');
      }
      const data = await res.json();
      return (data?.inventory ?? data) as InventoryAny;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['inventory', outletId] });
      const previous = queryClient.getQueryData<InventoryAny[]>(['inventory', outletId]);
      queryClient.setQueryData<InventoryAny[]>(['inventory', outletId], (old) => {
        if (!Array.isArray(old)) return old;
        const existing = old.find((i) => i.item_id === variables.item_id);
        if (existing) {
          return old.map((i) =>
            i.item_id === variables.item_id
              ? {
                  ...i,
                  stock: variables.stock,
                  low_stock_threshold: variables.low_stock_threshold ?? i.low_stock_threshold,
                  updated_at: new Date().toISOString(),
                }
              : i
          );
        }
        return [
          ...old,
          {
            id: `temp-${variables.item_id}`,
            outlet_id: outletId,
            item_id: variables.item_id,
            stock: variables.stock,
            low_stock_threshold: variables.low_stock_threshold ?? 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as InventoryAny,
        ];
      });
      return { previous };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['inventory', outletId], context.previous);
      }
      toast.error(err.message || 'Failed to update inventory');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', outletId] });
      toast.success('Inventory updated successfully');
    },
  });
}
