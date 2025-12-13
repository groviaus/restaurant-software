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
        order_items (
          *,
          items (*)
        )
      `)
      .eq('outlet_id', profile.outlet_id)
      .eq('status', 'COMPLETED')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by item
    const itemMap = new Map<string, {
      item_id: string;
      item_name: string;
      quantity: number;
      revenue: number;
    }>();

    orders?.forEach((order: any) => {
      order.order_items?.forEach((oi: any) => {
        const key = oi.item_id;
        const existing = itemMap.get(key) || {
          item_id: key,
          item_name: oi.items?.name || 'Unknown',
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += oi.quantity;
        existing.revenue += oi.price * oi.quantity;
        itemMap.set(key, existing);
      });
    });

    const report = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);

    if (format === 'csv') {
      const csv = generateItemwiseCSV(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="itemwise-sales-${startDate}-${endDate}.csv"`,
        },
      });
    }

    return NextResponse.json({ items: report });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateItemwiseCSV(report: any[]): string {
  const headers = ['Item Name', 'Quantity Sold', 'Total Revenue'];
  const rows = report.map(item => [
    item.item_name,
    item.quantity,
    item.revenue,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

