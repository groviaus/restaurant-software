import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { billRequestSchema } from '@/lib/schemas';
import { OrderStatus, PaymentMethod } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const body = await request.json();
    const validatedData = billRequestSchema.parse(body);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
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
      .eq('id', validatedData.order_id)
      .single();

    if (orderError) throw orderError;

    if (order.status === OrderStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Order is already completed' },
        { status: 400 }
      );
    }

    // Calculate totals with custom tax rate
    const subtotal = Number(order.subtotal);
    const tax = subtotal * validatedData.tax_rate;
    const total = subtotal + tax;

    // Update order with payment method and totals
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: validatedData.payment_method,
        tax: tax,
        total: total,
        status: OrderStatus.COMPLETED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.order_id)
      .select(`
        *,
        order_items (
          *,
          items (*)
        ),
        tables (*),
        users (*)
      `)
      .single();

    if (updateError) throw updateError;

    // Update table status if dine-in
    if (updatedOrder.table_id && updatedOrder.order_type === 'DINE_IN') {
      await supabase
        .from('tables')
        .update({ status: 'BILLED' })
        .eq('id', updatedOrder.table_id);
    }

    return NextResponse.json({
      order_id: updatedOrder.id,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payment_method: validatedData.payment_method,
      items: updatedOrder.order_items,
      created_at: updatedOrder.created_at,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate bill' },
      { status: 500 }
    );
  }
}

