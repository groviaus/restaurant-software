'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChefHat, CheckCircle2, ArrowRight, Activity } from 'lucide-react';
import { useRealtimeOrders } from '@/hooks/useRealtime';
import { createClient } from '@/lib/supabase/client';

interface OrderCounts {
    pending: number;
    preparing: number;
    ready: number;
    total: number;
}

interface ActiveOrdersWidgetProps {
    outletId: string;
}

export function ActiveOrdersWidget({ outletId }: ActiveOrdersWidgetProps) {
    const router = useRouter();
    const [counts, setCounts] = useState<OrderCounts>({
        pending: 0,
        preparing: 0,
        ready: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchOrderCounts = useCallback(async () => {
        if (!outletId) {
            setLoading(false);
            return;
        }
        try {
            const supabase = createClient();
            const { data: orders, error } = await supabase
                .from('orders')
                .select('status')
                .eq('outlet_id', outletId)
                .in('status', ['NEW', 'PREPARING', 'READY', 'SERVED']);

            if (error) {
                console.error('Error fetching active orders:', error);
                return;
            }

            const pending = orders?.filter((o: { status: string }) => o.status === 'NEW' || o.status === 'SERVED').length || 0;
            const preparing = orders?.filter((o: { status: string }) => o.status === 'PREPARING').length || 0;
            const ready = orders?.filter((o: { status: string }) => o.status === 'READY').length || 0;

            setCounts({
                pending,
                preparing,
                ready,
                total: pending + preparing + ready,
            });
        } catch (error) {
            console.error('Error fetching order counts:', error);
        } finally {
            setLoading(false);
        }
    }, [outletId]);

    useEffect(() => {
        fetchOrderCounts();
    }, [fetchOrderCounts]);

    // Subscribe to real-time order changes
    useRealtimeOrders({
        outletId,
        onChange: () => {
            fetchOrderCounts();
        },
    });

    const handleClick = () => {
        router.push('/orders');
    };

    const hasUrgentOrders = counts.pending > 0 || counts.ready > 0;

    if (loading) {
        return (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted/60 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-md cursor-pointer ${
                hasUrgentOrders ? 'ring-1 ring-orange-500/30' : ''
            }`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`Active orders: ${counts.total}. Click to view all orders.`}
        >
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                            Live Order Pipeline
                            {hasUrgentOrders ? (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </span>
                            ) : (
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {counts.total === 0 ? 'All caught up' : `${counts.total} orders in kitchen & dispatch`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>Manage Orders</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
            </div>

            {/* Pipeline Status Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {/* 1. New / Pending */}
                <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 dark:bg-amber-500/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                New / Unserved
                            </div>
                            <div className="text-xs text-muted-foreground">Needs attention</div>
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 dark:text-amber-200">
                        {counts.pending}
                    </div>
                </div>

                {/* 2. Preparing */}
                <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 dark:bg-blue-500/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300">
                            <ChefHat className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                In Kitchen
                            </div>
                            <div className="text-xs text-muted-foreground">Currently cooking</div>
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-blue-900 dark:text-blue-200">
                        {counts.preparing}
                    </div>
                </div>

                {/* 3. Ready */}
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Ready to Serve
                            </div>
                            <div className="text-xs text-muted-foreground">Awaiting pickup</div>
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                        {counts.ready}
                    </div>
                </div>
            </div>
        </div>
    );
}

