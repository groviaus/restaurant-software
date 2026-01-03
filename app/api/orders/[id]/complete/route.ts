import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { orderIdSchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
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
      await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', orderData.table_id);
    }

    // Auto stock deduction
    const profile = await getUserProfile();
    if (!profile) {
      // Profile check already done by requireAuth, but TypeScript needs this
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (effectiveOutletId && orderData.order_items) {
      const serviceClient = createServiceRoleClient();

      for (const orderItem of orderData.order_items) {
        // Get current inventory
        const { data: inventory } = await serviceClient
          .from('inventory')
          .select('*')
          .eq('outlet_id', effectiveOutletId)
          .eq('item_id', orderItem.item_id)
          .single();

        if (inventory) {
          const inventoryData = inventory as any;
          const newStock = inventoryData.stock - orderItem.quantity;

          // Update stock
          const stockUpdateData: any = { stock: Math.max(0, newStock) };
          await serviceClient
            .from('inventory')
            // @ts-expect-error - Supabase type inference issue
            .update(stockUpdateData)
            .eq('id', inventoryData.id);

          // Log the deduction
          const logData: any = {
            outlet_id: effectiveOutletId,
            item_id: orderItem.item_id,
            change: -orderItem.quantity,
            reason: `Order ${orderData.id} completed`,
            created_by: profile.id,
          };
          await serviceClient
            .from('inventory_logs')
            .insert(logData);
        }
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
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    );
  }
}

