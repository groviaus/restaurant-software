import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
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
        total,
        users (
          id,
          name
        )
      `)
      .eq('outlet_id', effectiveOutletId)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by staff
    const staffMap = new Map<string, { name: string; orders: number; sales: number }>();

    orders?.forEach((order: any) => {
      if (order.users) {
        const key = order.users.id;
        const existing = staffMap.get(key) || {
          name: order.users.name,
          orders: 0,
          sales: 0,
        };
        existing.orders += 1;
        existing.sales += Number(order.total);
        staffMap.set(key, existing);
      }
    });

    const performance = Array.from(staffMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);

    return NextResponse.json({ data: performance });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff performance' },
      { status: 500 }
    );
  }
}

