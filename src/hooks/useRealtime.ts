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
 * 
 * Usage:
 * ```tsx
 * useRealtimeOrders({
 *   outletId: currentOutlet?.id,
 *   onChange: () => {
 *     // Refetch orders or update state
 *     fetchOrders();
 *   },
 * });
 * ```
 */
export function useRealtimeOrders({
    outletId,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: UseRealtimeOrdersOptions) {
    const supabaseRef = useRef(createClient());
    const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);

    const handleChange = useCallback(
        (payload: OrderChangePayload) => {
            // Handle both payload structures (Supabase client transforms it, but be defensive)
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

            // Call specific handler
            switch (payload.eventType) {
                case 'INSERT':
                    console.log('[Realtime] INSERT event - new order:', newRecord);
                    onInsert?.(payload);
                    break;
                case 'UPDATE':
                    console.log('[Realtime] UPDATE event - order changed:', {
                        from: oldRecord,
                        to: newRecord,
                    });
                    onUpdate?.(payload);
                    break;
                case 'DELETE':
                    console.log('[Realtime] DELETE event - order deleted:', oldRecord);
                    onDelete?.(payload);
                    break;
            }

            // Call generic onChange handler
            onChange?.(payload);
        },
        [onInsert, onUpdate, onDelete, onChange]
    );

    useEffect(() => {
        if (!outletId) return;

        const supabase = supabaseRef.current;
        // Create a unique channel name
        const channelName = `orders-${outletId}-${Date.now()}`;

        // Subscribe to orders table changes for this outlet
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'orders',
                    filter: `outlet_id=eq.${outletId}`,
                },
                handleChange
            )
            .subscribe((status) => {
                console.log('[Realtime] Subscription status:', status);
            });

        channelRef.current = channel;

        // Cleanup on unmount or when outletId changes
        return () => {
            console.log('[Realtime] Unsubscribing from channel:', channelName);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [outletId, handleChange]);

    return {
        // Expose channel for manual operations if needed
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
    const supabaseRef = useRef(createClient());
    const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);

    useEffect(() => {
        if (!outletId) return;

        const supabase = supabaseRef.current;
        const channelName = `tables-${outletId}-${Date.now()}`;

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
                (payload) => {
                    console.log('[Realtime] Table change:', payload.eventType, payload);
                    onChange?.(payload);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [outletId, onChange]);

    return { channel: channelRef.current };
}

