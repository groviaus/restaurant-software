import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const outletId = (profile as any).outlet_id;
    if (!outletId) {
      return NextResponse.json(
        { error: 'User not assigned to an outlet' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const periodParam = searchParams.get('period') || 'month'; // today, week, month, year

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    
    // Parse date strings
    const [startYear, startMonth, startDay] = startDateParam.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateParam.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('outlet_id', outletId)
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine grouping strategy based on period
    let chartData: Array<{ date: string; time?: string; sales: number; orderCount: number }> = [];
    
    if (periodParam === 'today') {
      // Group by hour for today (00:00 to 23:00)
      const salesByHour = new Map<number, { sales: number; count: number }>();
      
      orders?.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const hour = orderDate.getHours();
        
        const existing = salesByHour.get(hour);
        if (existing) {
          existing.sales += Number(order.total);
          existing.count += 1;
        } else {
          salesByHour.set(hour, {
            sales: Number(order.total),
            count: 1,
          });
        }
      });

      // Create complete 24-hour data with zeros for missing hours
      for (let hour = 0; hour < 24; hour++) {
        const data = salesByHour.get(hour);
        chartData.push({
          date: startDateParam,
          time: `${hour.toString().padStart(2, '0')}:00`,
          sales: data ? Number(data.sales.toFixed(2)) : 0,
          orderCount: data ? data.count : 0,
        });
      }
    } else if (periodParam === 'week') {
      // Group by day for week (7 days)
      const salesByDate = new Map<string, { sales: number; count: number }>();
      
      orders?.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const existing = salesByDate.get(dateKey);
        if (existing) {
          existing.sales += Number(order.total);
          existing.count += 1;
        } else {
          salesByDate.set(dateKey, {
            sales: Number(order.total),
            count: 1,
          });
        }
      });

      // Fill in all 7 days with zero sales for missing dates
      const currentDate = new Date(startDate);
      for (let i = 0; i < 7; i++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const data = salesByDate.get(dateKey);
        
        chartData.push({
          date: dateKey,
          sales: data ? Number(data.sales.toFixed(2)) : 0,
          orderCount: data ? data.count : 0,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (periodParam === 'month') {
      // Group by date for month (30 days)
      const salesByDate = new Map<string, { sales: number; count: number }>();
      
      orders?.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const existing = salesByDate.get(dateKey);
        if (existing) {
          existing.sales += Number(order.total);
          existing.count += 1;
        } else {
          salesByDate.set(dateKey, {
            sales: Number(order.total),
            count: 1,
          });
        }
      });

      // Fill in all 30 days with zero sales for missing dates
      const currentDate = new Date(startDate);
      for (let i = 0; i < 30; i++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const data = salesByDate.get(dateKey);
        
        chartData.push({
          date: dateKey,
          sales: data ? Number(data.sales.toFixed(2)) : 0,
          orderCount: data ? data.count : 0,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (periodParam === 'year') {
      // Group by month for year (Jan to Dec)
      const salesByMonth = new Map<number, { sales: number; count: number }>();
      
      orders?.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const month = orderDate.getMonth(); // 0-11
        
        const existing = salesByMonth.get(month);
        if (existing) {
          existing.sales += Number(order.total);
          existing.count += 1;
        } else {
          salesByMonth.set(month, {
            sales: Number(order.total),
            count: 1,
          });
        }
      });

      // Create data for all 12 months (Jan to Dec)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date(startDate).getFullYear();
      
      for (let month = 0; month < 12; month++) {
        const data = salesByMonth.get(month);
        chartData.push({
          date: `${currentYear}-${String(month + 1).padStart(2, '0')}`,
          sales: data ? Number(data.sales.toFixed(2)) : 0,
          orderCount: data ? data.count : 0,
        });
      }
    }

    return NextResponse.json({ 
      data: chartData,
      period: periodParam,
      totalOrders: orders?.length || 0,
      totalSales: orders?.reduce((sum, o: any) => sum + Number(o.total), 0) || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales trend' },
      { status: 500 }
    );
  }
}

