import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
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

    // Parse date strings - extract year, month, day to match dashboard logic exactly
    // Dashboard uses: new Date(localYear, localMonth, localDate, 0, 0, 0, 0)
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    // Calculate if this is a "today" period (endDate is exactly 1 day after startDate)
    const startDateObj = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const endDateObj = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
    const daysDiff = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const isTodayPeriod = daysDiff === 1;

    // Use the same calculation as dashboard: local timezone boundaries
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    let end: Date;
    if (isTodayPeriod) {
      // For today, endDate is tomorrow's date (exclusive), use it as-is
      end = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
    } else {
      // For other periods, include the full end date
      end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/api/analytics/summary/route.ts:50', message: 'Analytics Summary API - Date calculation', data: { startDate, endDate, startISO: start.toISOString(), endISO: end.toISOString(), isTodayPeriod, daysDiff, startLocal: start.toString(), endLocal: end.toString() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    // Fetch all orders in the date range
    // Use .lt() for today period (exclusive) and .lte() for others (inclusive)
    let queryBuilder = supabase
      .from('orders')
      .select('total, status, created_at')
      .eq('outlet_id', effectiveOutletId)
      .gte('created_at', start.toISOString());

    if (isTodayPeriod) {
      queryBuilder = queryBuilder.lt('created_at', end.toISOString());
    } else {
      queryBuilder = queryBuilder.lte('created_at', end.toISOString());
    }

    const { data: orders, error } = await queryBuilder;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/api/analytics/summary/route.ts:70', message: 'Analytics Summary API - Query result', data: { hasError: !!error, error: error?.message || null, ordersCount: orders?.length || 0, orders: orders?.map((o: any) => ({ id: o.id || 'unknown', total: o.total, status: o.status, created_at: o.created_at })) || [], allStatuses: orders?.map((o: any) => o.status) || [] }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const completedOrders = orders?.filter((o: any) => o.status === 'COMPLETED') || [];
    const totalSales = completedOrders.reduce((sum, order: any) => sum + Number(order.total), 0);
    const totalOrders = orders?.length || 0;
    const averageOrderValue = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;
    const cancelledOrders = orders?.filter((o: any) => o.status === 'CANCELLED').length || 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'app/api/analytics/summary/route.ts:80', message: 'Analytics Summary API - Calculated metrics', data: { totalSales, totalOrders, completedOrders: completedOrders.length, cancelledOrders, averageOrderValue, cancellationRate }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'C' }) }).catch(() => { });
    // #endregion

    return NextResponse.json({
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders,
      completedOrders: completedOrders.length,
      cancelledOrders,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      cancellationRate: Number(cancellationRate.toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}

