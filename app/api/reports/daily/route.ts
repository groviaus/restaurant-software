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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'json';

    const supabase = createServiceRoleClient();
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          items (*)
        ),
        users (*)
      `)
      .eq('outlet_id', profile.outlet_id)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
    const totalOrders = orders?.length || 0;

    const report = {
      date,
      totalSales,
      totalOrders,
      orders: orders || [],
    };

    if (format === 'csv') {
      const csv = generateDailySalesCSV(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="daily-sales-${date}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateDailySalesCSV(report: any): string {
  const headers = ['Order ID', 'Date', 'Time', 'Staff', 'Type', 'Total', 'Payment Method'];
  const rows = report.orders.map((order: any) => [
    order.id,
    new Date(order.created_at).toLocaleDateString(),
    new Date(order.created_at).toLocaleTimeString(),
    order.users?.name || '',
    order.order_type,
    order.total,
    order.payment_method || '',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

