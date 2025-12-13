import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    if (!profile?.outlet_id) {
      return NextResponse.json(
        { error: 'User not assigned to an outlet' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const supabase = createServiceRoleClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at')
      .eq('outlet_id', profile.outlet_id)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by hour
    const ordersByHour = new Map<number, number>();
    orders?.forEach((order) => {
      const hour = new Date(order.created_at).getHours();
      ordersByHour.set(hour, (ordersByHour.get(hour) || 0) + 1);
    });

    // Create data for all 24 hours
    const chartData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      orders: ordersByHour.get(i) || 0,
    }));

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch peak hours' },
      { status: 500 }
    );
  }
}

