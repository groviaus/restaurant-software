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
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'json';

    const supabase = createServiceRoleClient();
    
    // Parse date strings and convert IST boundaries to UTC for database queries
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    
    // Start of day in IST (midnight IST), converted to UTC
    const startIST = Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const start = new Date(startIST - istOffsetMs);
    
    // End of day in IST (23:59:59 IST), converted to UTC
    const endIST = Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    const end = new Date(endIST - istOffsetMs);

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (*)
      `)
      .eq('outlet_id', effectiveOutletId)
      .eq('status', 'COMPLETED')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by staff
    const staffMap = new Map<string, {
      user_id: string;
      user_name: string;
      orders: number;
      totalSales: number;
    }>();

    orders?.forEach((order: any) => {
      const key = order.user_id;
      const existing = staffMap.get(key) || {
        user_id: key,
        user_name: order.users?.name || 'Unknown',
        orders: 0,
        totalSales: 0,
      };
      existing.orders += 1;
      existing.totalSales += order.total;
      staffMap.set(key, existing);
    });

    const report = Array.from(staffMap.values()).sort((a, b) => b.totalSales - a.totalSales);

    if (format === 'csv') {
      const csv = generateStaffCSV(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="staff-performance-${startDate}-${endDate}.csv"`,
        },
      });
    }

    return NextResponse.json({ staff: report });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateStaffCSV(report: any[]): string {
  const headers = ['Staff Name', 'Orders', 'Total Sales'];
  const rows = report.map(staff => [
    staff.user_name,
    staff.orders,
    staff.totalSales,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

