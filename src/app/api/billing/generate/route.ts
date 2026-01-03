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

    const orderData = order as any;

    if (orderData.status === OrderStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Order is already completed' },
        { status: 400 }
      );
    }

    // Calculate totals with custom tax rate
    const subtotal = Number(orderData.subtotal);
    const tax = subtotal * validatedData.tax_rate;
    const total = subtotal + tax;

    // Update order with payment method and totals
    const updateData: any = {
      payment_method: validatedData.payment_method,
      tax: tax,
      total: total,
      status: OrderStatus.COMPLETED,
      updated_at: new Date().toISOString(),
    };
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
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

    const updatedOrderData = updatedOrder as any;

    // Update table status to EMPTY if dine-in (table is now available for new orders)
    if (updatedOrderData.table_id && updatedOrderData.order_type === 'DINE_IN') {
      const tableUpdateData: any = { status: 'EMPTY' };
      await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', updatedOrderData.table_id);
    }

    return NextResponse.json({
      order_id: updatedOrderData.id,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payment_method: validatedData.payment_method,
      items: updatedOrderData.order_items,
      created_at: updatedOrderData.created_at,
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

