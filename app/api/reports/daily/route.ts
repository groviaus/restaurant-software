import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('reports', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json(
        { error: 'User not assigned to an outlet' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'json';

    const supabase = createServiceRoleClient();
    
    // Parse date string and convert IST boundaries to UTC for database queries
    const [year, month, day] = date.split('-').map(Number);
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    
    // Start of day in IST (midnight IST), converted to UTC
    const startIST = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    const startDate = new Date(startIST - istOffsetMs);
    
    // End of day in IST (23:59:59 IST), converted to UTC
    const endIST = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
    const endDate = new Date(endIST - istOffsetMs);

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
      .eq('outlet_id', effectiveOutletId)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalSales = orders?.reduce((sum, order: any) => sum + Number(order.total), 0) || 0;
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

