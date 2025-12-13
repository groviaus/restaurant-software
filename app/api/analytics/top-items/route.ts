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
    const limit = parseInt(searchParams.get('limit') || '5');

    const supabase = createServiceRoleClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        order_items (
          quantity,
          price,
          items (
            id,
            name
          )
        )
      `)
      .eq('outlet_id', profile.outlet_id)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by item
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    orders?.forEach((order: any) => {
      order.order_items?.forEach((oi: any) => {
        if (oi.items) {
          const key = oi.items.id;
          const existing = itemMap.get(key) || {
            name: oi.items.name,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += oi.quantity;
          existing.revenue += Number(oi.price) * oi.quantity;
          itemMap.set(key, existing);
        }
      });
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    const lowItems = Array.from(itemMap.values())
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, limit);

    return NextResponse.json({
      top: topItems,
      low: lowItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch top items' },
      { status: 500 }
    );
  }
}

