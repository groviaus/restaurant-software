import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    // Only admins can view outlet-wise reports
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'json';

    const supabase = createServiceRoleClient();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        outlets (*)
      `)
      .eq('status', 'COMPLETED')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by outlet
    const outletMap = new Map<string, {
      outlet_id: string;
      outlet_name: string;
      orders: number;
      totalSales: number;
    }>();

    orders?.forEach((order: any) => {
      const key = order.outlet_id;
      const existing = outletMap.get(key) || {
        outlet_id: key,
        outlet_name: order.outlets?.name || 'Unknown',
        orders: 0,
        totalSales: 0,
      };
      existing.orders += 1;
      existing.totalSales += order.total;
      outletMap.set(key, existing);
    });

    const report = Array.from(outletMap.values()).sort((a, b) => b.totalSales - a.totalSales);

    if (format === 'csv') {
      const csv = generateOutletwiseCSV(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="outletwise-sales-${startDate}-${endDate}.csv"`,
        },
      });
    }

    return NextResponse.json({ outlets: report });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateOutletwiseCSV(report: any[]): string {
  const headers = ['Outlet Name', 'Orders', 'Total Sales'];
  const rows = report.map(outlet => [
    outlet.outlet_name,
    outlet.orders,
    outlet.totalSales,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

