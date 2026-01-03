import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    const { id: outletId } = await params;

    // Check access
    if (profile?.role !== 'admin' && effectiveOutletId !== outletId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const supabase = createServiceRoleClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales summary
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('outlet_id', outletId)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString());

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const totalSales = orders?.reduce((sum, order: any) => sum + Number(order.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Payment method breakdown
    const paymentBreakdown = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
    };

    orders?.forEach((order: any) => {
      if (order.payment_method && order.payment_method in paymentBreakdown) {
        paymentBreakdown[order.payment_method as keyof typeof paymentBreakdown] += Number(order.total);
      }
    });

    // Get outlet info
    const { data: outlet } = await supabase
      .from('outlets')
      .select('*')
      .eq('id', outletId)
      .single();

    return NextResponse.json({
      outlet,
      summary: {
        totalSales,
        totalOrders,
        avgOrderValue,
        paymentBreakdown,
        period: `${days} days`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch outlet summary' },
      { status: 500 }
    );
  }
}

