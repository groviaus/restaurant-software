'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type OrderChangePayload = RealtimePostgresChangesPayload<{
    [key: string]: any;
}>;

interface UseRealtimeOrdersOptions {
    outletId?: string;
    onInsert?: (payload: OrderChangePayload) => void;
    onUpdate?: (payload: OrderChangePayload) => void;
    onDelete?: (payload: OrderChangePayload) => void;
    onChange?: (payload: OrderChangePayload) => void;
}

/**
 * Hook to subscribe to real-time order changes via Supabase Realtime.
 * When using TanStack Query, pass onChange that invalidates orders (and tables) cache:
 *   queryClient.invalidateQueries({ queryKey: ['orders'] });
 *   queryClient.invalidateQueries({ queryKey: ['tables'] });
 */
export function useRealtimeOrders({
    outletId,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: UseRealtimeOrdersOptions) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Keep latest callback references in refs so we don't recreate the channel on every render
    const onInsertRef = useRef(onInsert);
    onInsertRef.current = onInsert;
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;
    const onDeleteRef = useRef(onDelete);
    onDeleteRef.current = onDelete;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const handleChange = useCallback((payload: OrderChangePayload) => {
        const newRecord = (payload as any).new || (payload as any).data?.record || payload.new;
        const oldRecord = (payload as any).old || (payload as any).data?.old_record || payload.old;
        
        console.log('[Realtime] Order change received:', {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            new: newRecord,
            old: oldRecord,
            fullPayload: payload,
        });

        switch (payload.eventType) {
            case 'INSERT':
                console.log('[Realtime] INSERT event - new order:', newRecord);
                onInsertRef.current?.(payload);
                break;
            case 'UPDATE':
                console.log('[Realtime] UPDATE event - order changed:', {
                    from: oldRecord,
                    to: newRecord,
                });
                onUpdateRef.current?.(payload);
                break;
            case 'DELETE':
                console.log('[Realtime] DELETE event - order deleted:', oldRecord);
                onDeleteRef.current?.(payload);
                break;
        }

        onChangeRef.current?.(payload);
    }, []);

    useEffect(() => {
        if (!outletId) return;

        const channelName = `orders-${outletId}-${Date.now()}`;
        console.log('[Realtime] Subscribing to orders channel:', channelName, 'for outlet:', outletId);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `outlet_id=eq.${outletId}`,
                },
                handleChange
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Orders subscription status:', status, err || '');
            });

        channelRef.current = channel;

        return () => {
            console.log('[Realtime] Unsubscribing from orders channel:', channelName);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [outletId, supabase, handleChange]);

    return {
        channel: channelRef.current,
    };
}

/**
 * Hook to subscribe to real-time table status changes.
 */
export function useRealtimeTables({
    outletId,
    onChange,
}: {
    outletId?: string;
    onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const handleChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
        console.log('[Realtime] Table change:', payload.eventType, payload);
        onChangeRef.current?.(payload);
    }, []);

    useEffect(() => {
        if (!outletId) return;

        const channelName = `tables-${outletId}-${Date.now()}`;
        console.log('[Realtime] Subscribing to tables channel:', channelName, 'for outlet:', outletId);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tables',
                    filter: `outlet_id=eq.${outletId}`,
                },
                handleChange
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Tables subscription status:', status, err || '');
            });

        channelRef.current = channel;

        return () => {
            console.log('[Realtime] Unsubscribing from tables channel:', channelName);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [outletId, supabase, handleChange]);

    return { channel: channelRef.current };
}

/**
 * Hook to subscribe to real-time inventory changes.
 */
export function useRealtimeInventory({
    outletId,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: {
    outletId?: string;
    onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const onInsertRef = useRef(onInsert);
    onInsertRef.current = onInsert;
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;
    const onDeleteRef = useRef(onDelete);
    onDeleteRef.current = onDelete;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const handleChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
        const newRecord = (payload as any).new || (payload as any).data?.record || payload.new;
        const oldRecord = (payload as any).old || (payload as any).data?.old_record || payload.old;
        
        console.log('[Realtime] Inventory change received:', {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            new: newRecord,
            old: oldRecord,
        });

        switch (payload.eventType) {
            case 'INSERT':
                onInsertRef.current?.(payload);
                break;
            case 'UPDATE':
                onUpdateRef.current?.(payload);
                break;
            case 'DELETE':
                onDeleteRef.current?.(payload);
                break;
        }

        onChangeRef.current?.(payload);
    }, []);

    useEffect(() => {
        if (!outletId) return;

        const channelName = `inventory-${outletId}-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory_items',
                    filter: `outlet_id=eq.${outletId}`,
                },
                handleChange
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory',
                    filter: `outlet_id=eq.${outletId}`,
                },
                handleChange
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Inventory subscription status:', status, err || '');
            });

        channelRef.current = channel;

        return () => {
            console.log('[Realtime] Unsubscribing from inventory channel:', channelName);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [outletId, supabase, handleChange]);

    return { channel: channelRef.current };
}

/**
 * Hook to subscribe to real-time inventory logs changes.
 */
export function useRealtimeInventoryLogs({
    outletId,
    onChange,
}: {
    outletId?: string;
    onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const handleChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
        console.log('[Realtime] Inventory log change:', payload.eventType, payload);
        onChangeRef.current?.(payload);
    }, []);

    useEffect(() => {
        if (!outletId) return;

        const channelName = `inventory-logs-${outletId}-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory_logs',
                    filter: `outlet_id=eq.${outletId}`,
                },
                handleChange
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Inventory logs subscription status:', status, err || '');
            });

        channelRef.current = channel;

        return () => {
            console.log('[Realtime] Unsubscribing from inventory logs channel:', channelName);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [outletId, supabase, handleChange]);

    return { channel: channelRef.current };
}

