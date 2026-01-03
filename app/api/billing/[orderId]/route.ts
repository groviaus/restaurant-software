import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { billOrderIdSchema } from '@/lib/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { orderId: paramsOrderId } = await params;
    const { orderId } = billOrderIdSchema.parse({ orderId: paramsOrderId });

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
      { error: error.message || 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}

