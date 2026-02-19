'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Table } from '@/lib/types';
import type { CreateTableRequest, UpdateTableRequest } from '@/lib/types';

type TableAny = Table & Record<string, unknown>;

export function useCreateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateTableRequest) => {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create table');
      }
      return res.json() as Promise<TableAny>;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['tables', variables.outlet_id] });
      const previous = queryClient.getQueriesData({ queryKey: ['tables'] });
      const tempId = `temp-${Date.now()}`;
      const optimistic: TableAny = {
        id: tempId,
        outlet_id: variables.outlet_id,
        name: variables.name,
        status: (variables.status as Table['status']) ?? 'EMPTY',
        capacity: variables.capacity ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueriesData<TableAny[]>(
        { queryKey: ['tables'] },
        (old) => (Array.isArray(old) ? [...old, optimistic] : old)
      );
      return { previous, tempId };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to create table');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.outlet_id] });
      toast.success('Table created');
    },
  });
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateTableRequest & { id: string }) => {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update table');
      }
      return res.json() as Promise<TableAny>;
    },
    onMutate: async ({ id, ...variables }) => {
      await queryClient.cancelQueries({ queryKey: ['tables'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tables'] });
      queryClient.setQueriesData<TableAny[]>(
        { queryKey: ['tables'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((t) =>
            t.id === id ? { ...t, ...variables, updated_at: new Date().toISOString() } : t
          );
        }
      );
      return { previous };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to update table');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables', data.outlet_id] });
      toast.success('Table updated');
    },
  });
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, outletId }: { id: string; outletId: string }) => {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete table');
      }
    },
    onMutate: async ({ id, outletId }) => {
      await queryClient.cancelQueries({ queryKey: ['tables'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tables'] });
      queryClient.setQueriesData<TableAny[]>(
        { queryKey: ['tables'] },
        (old) => (Array.isArray(old) ? old.filter((t) => t.id !== id) : old)
      );
      return { previous };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      toast.error(err.message || 'Failed to delete table');
    },
    onSuccess: (_data, { outletId }) => {
      queryClient.invalidateQueries({ queryKey: ['tables', outletId] });
      toast.success('Table deleted');
    },
  });
}
