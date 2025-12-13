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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'none'; // 'none', 'day', 'date'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    
    // Parse date strings
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    // Fetch orders with items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        payment_method,
        created_at,
        order_items (
          quantity,
          price,
          items (
            name
          )
        )
      `)
      .eq('outlet_id', profile.outlet_id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders list query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Orders fetched:', {
      count: orders?.length || 0,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      outletId: profile.outlet_id,
    });

    // Format orders
    const formattedOrders = orders?.map((order: any, index: number) => ({
      id: order.id,
      orderNumber: `ORD-${order.id.substring(0, 8).toUpperCase()}`, // Generate order number from ID
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.payment_method || 'CASH',
      createdAt: order.created_at,
      items: order.order_items?.map((oi: any) => ({
        name: oi.items?.name || 'Unknown',
        quantity: oi.quantity,
        price: Number(oi.price),
      })) || [],
    })) || [];

    console.log('Formatted orders:', formattedOrders.length);

    // Group by date if requested
    if (groupBy === 'date' || groupBy === 'day') {
      const grouped: Record<string, any[]> = {};
      
      formattedOrders.forEach((order) => {
        const date = new Date(order.createdAt);
        const dateKey = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(order);
      });

      const groupedArray = Object.entries(grouped).map(([date, orders]) => ({
        date,
        orders,
        totalSales: orders.reduce((sum, o) => sum + o.total, 0),
        orderCount: orders.length,
      }));

      return NextResponse.json({
        grouped: groupedArray,
        totalOrders: formattedOrders.length,
        totalSales: formattedOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }

    return NextResponse.json({
      orders: formattedOrders,
      totalOrders: formattedOrders.length,
      totalSales: formattedOrders.reduce((sum, o) => sum + o.total, 0),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders list' },
      { status: 500 }
    );
  }
}

