'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, CheckCircle2 } from 'lucide-react';
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

    const fetchOrderCounts = async () => {
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
    };

    useEffect(() => {
        fetchOrderCounts();
    }, [outletId]);

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
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Active Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-16 flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">Loading...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={`cursor-pointer hover:shadow-md transition-all duration-200 ${hasUrgentOrders ? 'ring-2 ring-orange-500 ring-offset-2' : ''
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
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <span>Active Orders</span>
                    {hasUrgentOrders && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {counts.total}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {counts.pending > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{counts.pending} New/Served</span>
                            </Badge>
                        )}
                        {counts.preparing > 0 && (
                            <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
                                <ChefHat className="h-3 w-3" />
                                <span>{counts.preparing} Preparing</span>
                            </Badge>
                        )}
                        {counts.ready > 0 && (
                            <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{counts.ready} Ready</span>
                            </Badge>
                        )}
                        {counts.total === 0 && (
                            <p className="text-sm text-gray-500">No active orders</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
