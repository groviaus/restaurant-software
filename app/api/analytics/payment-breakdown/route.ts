import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('analytics', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
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
      // Use IST timezone to match dashboard and orders page
      const [startYear, startMonth, startDay] = startDateParam.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDateParam.split('-').map(Number);
      
      // Convert IST date boundaries to UTC for database queries
      const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      const startIST = Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const endIST = Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      startDate = new Date(startIST - istOffsetMs);
      endDate = new Date(endIST - istOffsetMs);
    } else {
      // Use IST for default date calculation
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + istOffsetMs);
      const istYear = nowIST.getUTCFullYear();
      const istMonth = nowIST.getUTCMonth();
      const istDate = nowIST.getUTCDate();
      const startIST = Date.UTC(istYear, istMonth, istDate - days, 0, 0, 0, 0);
      startDate = new Date(startIST - istOffsetMs);
    }

    let queryBuilder = supabase
      .from('orders')
      .select('total, payment_method')
      .eq('outlet_id', effectiveOutletId)
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

    orders?.forEach((order: any) => {
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

