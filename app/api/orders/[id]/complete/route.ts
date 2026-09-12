import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId , handleApiError } from '@/lib/auth';
import { orderIdSchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';
import { consumeForOrder } from '@/lib/inventory/inventoryService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('orders', 'edit');
    const supabase = await createClient();

    // Await params in Next.js 15+
    const { id: paramsId } = await params;
    const { id } = orderIdSchema.parse({ id: paramsId });

    const updateData: any = {
      status: OrderStatus.COMPLETED,
      updated_at: new Date().toISOString()
    };
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

    // Update table status to EMPTY if dine-in (table is now available for new orders)
    if (orderData.table_id && orderData.order_type === 'DINE_IN') {
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

    // ─── Ledger-based Inventory Consumption ──────────────────────────────────
    // Uses the centralized inventoryService — idempotent, ledger-based.
    // If movements already exist for this order, the service skips silently.
    const orderOutletId = orderData.outlet_id;
    const profile = await getUserProfile();
    if (!profile) {
      // Profile check already done by requireAuth, but TypeScript needs this
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (orderOutletId && orderData.order_items && orderData.order_items.length > 0) {
      try {
        const serviceClient = createServiceRoleClient();
        const orderLabel = orderData.order_number ? `Order #${orderData.order_number}` : `Order #${id.slice(0, 8)}`;
        await consumeForOrder({
          orderId: id,
          orderLabel,
          orderItems: orderData.order_items.map((oi: any) => ({
            item_id: oi.item_id,
            quantity: oi.quantity,
            quantity_type: oi.quantity_type,
          })),
          outletId: orderOutletId,
          userId: profile.id,
          supabase: serviceClient,
        });
      } catch (inventoryError) {
        console.error('[Complete Order] Inventory consumption failed:', inventoryError);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error, 'Failed to complete order');
  }
}

