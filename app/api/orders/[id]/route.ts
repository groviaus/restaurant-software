import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile , handleApiError } from '@/lib/auth';
import { updateOrderStatusSchema, orderIdSchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';
import { reverseOrderConsumption, consumeForOrder } from '@/lib/inventory/inventoryService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('orders', 'view');
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
    return handleApiError(error, 'Failed to fetch order');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('orders', 'edit');
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
      const { error: tableUpdateError } = await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', orderData.table_id);
      
      if (tableUpdateError) {
        console.error('Failed to update table status to EMPTY:', tableUpdateError);
        // Don't fail the request, but log the error
      }
    }

    const profile = await getUserProfile();

    // If order was completed, consume inventory (idempotent — skips if already consumed)
    if (validatedData.status === 'COMPLETED' && orderData.outlet_id && orderData.order_items?.length > 0) {
      try {
        const orderLabel = orderData.order_number ? `Order #${orderData.order_number}` : `Order #${id.slice(0, 8)}`;
        const serviceClient = createServiceRoleClient();
        await consumeForOrder({
          orderId: id,
          orderLabel,
          orderItems: orderData.order_items.map((oi: any) => ({
            item_id: oi.item_id,
            quantity: oi.quantity,
            quantity_type: oi.quantity_type,
          })),
          outletId: orderData.outlet_id,
          userId: profile?.id,
          supabase: serviceClient,
        });
      } catch (consError) {
        console.error('Failed to consume inventory on order completion:', consError);
      }
    }

    // If order was cancelled, reverse any inventory consumption (idempotent — skips if already reversed)
    if (validatedData.status === 'CANCELLED' && orderData.outlet_id) {
      try {
        const orderLabel = orderData.order_number ? `Order #${orderData.order_number}` : `Order #${id.slice(0, 8)}`;
        const serviceClient = createServiceRoleClient();
        await reverseOrderConsumption(
          id,
          orderLabel,
          orderData.outlet_id,
          profile?.id,
          serviceClient
        );
      } catch (revError) {
        console.error('Failed to reverse inventory consumption on cancellation:', revError);
      }
    }

    return NextResponse.json(orderData);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error, 'Failed to update order');
  }
}

