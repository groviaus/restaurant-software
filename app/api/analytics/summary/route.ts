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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Parse date strings - extract year, month, day and use IST timezone
    // This matches the dashboard logic which uses IST (Asia/Kolkata) for consistency
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    // Convert IST date boundaries to UTC for database queries
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    
    // Calculate if this is a "today" period (endDate is exactly 1 day after startDate)
    const startIST = Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const endIST = Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
    const startDateObj = new Date(startIST - istOffsetMs);
    const endDateObj = new Date(endIST - istOffsetMs);
    const daysDiff = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const isTodayPeriod = daysDiff === 1;

    // Convert IST boundaries to UTC for database queries
    const start = new Date(startIST - istOffsetMs);

    let end: Date;
    if (isTodayPeriod) {
      // For today, endDate is tomorrow's date in IST (exclusive)
      end = new Date(endIST - istOffsetMs);
    } else {
      // For other periods, include the full end date in IST
      const endISTFull = Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      end = new Date(endISTFull - istOffsetMs);
    }

    // Debug logging
    console.log('[Analytics Summary API] Date calculation:', {
      outletId: effectiveOutletId,
      startDate,
      endDate,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      isTodayPeriod,
      daysDiff,
    });

    // Fetch all orders with items and profit margins
    // Use .lt() for today period (exclusive) and .lte() for others (inclusive)
    let queryBuilder = supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        order_items (
          quantity,
          price,
          items (
            profit_margin_percent
          )
        )
      `)
      .eq('outlet_id', effectiveOutletId)
      .gte('created_at', start.toISOString());

    if (isTodayPeriod) {
      queryBuilder = queryBuilder.lt('created_at', end.toISOString());
    } else {
      queryBuilder = queryBuilder.lte('created_at', end.toISOString());
    }

    const { data: orders, error } = await queryBuilder;

    // Debug logging
    console.log('[Analytics Summary API] Query result:', {
      outletId: effectiveOutletId,
      dateRange: { from: start.toISOString(), to: end.toISOString() },
      ordersCount: orders?.length || 0,
      hasError: !!error,
      error: error?.message || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const completedOrdersQuery = orders?.filter((o: any) => o.status === 'COMPLETED') || [];
    const totalSales = completedOrdersQuery.reduce((sum, order: any) => sum + Number(order.total), 0);
    const totalOrders = orders?.length || 0;
    const averageOrderValue = completedOrdersQuery.length > 0 ? totalSales / completedOrdersQuery.length : 0;
    const cancelledOrders = orders?.filter((o: any) => o.status === 'CANCELLED').length || 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // Calculate Net Profit
    // Sum of (item_price * quantity * (profit_margin_percent / 100)) for all items in completed orders
    const netProfit = completedOrdersQuery.reduce((totalProfit, order: any) => {
      if (!order.order_items) return totalProfit;

      const orderProfit = order.order_items.reduce((op: number, item: any) => {
        const marginPercent = item.items?.profit_margin_percent || 0;
        const itemRevenue = item.price * item.quantity;
        return op + (itemRevenue * (marginPercent / 100));
      }, 0);

      return totalProfit + orderProfit;
    }, 0);

    // Debug logging for calculated metrics
    console.log('[Analytics Summary API] Calculated metrics:', {
      outletId: effectiveOutletId,
      totalSales,
      totalOrders,
      completedOrders: completedOrdersQuery.length,
      cancelledOrders,
      averageOrderValue,
      cancellationRate,
      netProfit,
    });

    return NextResponse.json({
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders,
      completedOrders: completedOrdersQuery.length,
      cancelledOrders,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      cancellationRate: Number(cancellationRate.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}

