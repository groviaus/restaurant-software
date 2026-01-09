import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { updateOrderStatusSchema, orderIdSchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const supabase = await createClient();

    // Await params in Next.js 15+
    const { id: paramsId } = await params;
    const { id } = orderIdSchema.parse({ id: paramsId });

    const { data, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const supabase = await createClient();

    // Await params in Next.js 15+
    const { id: paramsId } = await params;
    const { id } = orderIdSchema.parse({ id: paramsId });
    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    const updateData: any = {
      status: validatedData.status,
      updated_at: new Date().toISOString(),
    };

    // Include cancellation_reason if provided
    if (validatedData.cancellation_reason !== undefined) {
      updateData.cancellation_reason = validatedData.cancellation_reason;
    }

    const { data, error } = await supabase
      .from('orders')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
      .eq('id', id)
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

    if (error) throw error;

    const orderData = data as any;

    // Update table status if order is completed or cancelled
    if (orderData.table_id && (validatedData.status === 'COMPLETED' || validatedData.status === 'CANCELLED')) {
      const tableUpdateData: any = { status: 'EMPTY' };
      await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', orderData.table_id);
    }

    return NextResponse.json(orderData);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

