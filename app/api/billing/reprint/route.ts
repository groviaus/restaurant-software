import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { billOrderIdSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { orderId } = billOrderIdSchema.parse({ orderId: body.order_id });

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          items (*)
        ),
        tables (*),
        users (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = order as any;

    if (orderData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order is not completed. Cannot reprint bill.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      order_id: orderData.id,
      subtotal: Number(orderData.subtotal),
      tax: Number(orderData.tax),
      total: Number(orderData.total),
      payment_method: orderData.payment_method,
      items: orderData.order_items,
      created_at: orderData.created_at,
      order: orderData,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to reprint bill' },
      { status: 500 }
    );
  }
}

