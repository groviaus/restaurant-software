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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '30');

    const supabase = createServiceRoleClient();
    let startDate: Date;
    let endDate: Date | null = null;

    if (startDateParam && endDateParam) {
      const [startYear, startMonth, startDay] = startDateParam.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDateParam.split('-').map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    let queryBuilder = supabase
      .from('orders')
      .select('total, payment_method')
      .eq('outlet_id', profile.outlet_id)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString());

    if (endDate) {
      queryBuilder = queryBuilder.lte('created_at', endDate.toISOString());
    }

    const { data: orders, error } = await queryBuilder;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const breakdown = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
    };

    orders?.forEach((order) => {
      if (order.payment_method && order.payment_method in breakdown) {
        breakdown[order.payment_method as keyof typeof breakdown] += Number(order.total);
      }
    });

    const chartData = [
      { method: 'Cash', amount: breakdown.CASH, fill: 'var(--chart-1)' },
      { method: 'UPI', amount: breakdown.UPI, fill: 'var(--chart-2)' },
      { method: 'Card', amount: breakdown.CARD, fill: 'var(--chart-3)' },
    ].filter((item) => item.amount > 0);

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment breakdown' },
      { status: 500 }
    );
  }
}

