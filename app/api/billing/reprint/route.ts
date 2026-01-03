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

    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order is not completed. Cannot reprint bill.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      order_id: order.id,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      payment_method: order.payment_method,
      items: order.order_items,
      created_at: order.created_at,
      order: order,
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

