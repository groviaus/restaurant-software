import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
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

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: OrderStatus.COMPLETED,
        updated_at: new Date().toISOString() 
      })
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

    // Update table status if dine-in
    if (data.table_id && data.order_type === 'DINE_IN') {
      await supabase
        .from('tables')
        .update({ status: 'BILLED' })
        .eq('id', data.table_id);
    }

    // Auto stock deduction
    const profile = await getUserProfile();
    if (profile?.outlet_id && data.order_items) {
      const serviceClient = createServiceRoleClient();
      
      for (const orderItem of data.order_items) {
        // Get current inventory
        const { data: inventory } = await serviceClient
          .from('inventory')
          .select('*')
          .eq('outlet_id', profile.outlet_id)
          .eq('item_id', orderItem.item_id)
          .single();

        if (inventory) {
          const newStock = inventory.stock - orderItem.quantity;
          
          // Update stock
          await serviceClient
            .from('inventory')
            .update({ stock: Math.max(0, newStock) })
            .eq('id', inventory.id);

          // Log the deduction
          await serviceClient
            .from('inventory_logs')
            .insert({
              outlet_id: profile.outlet_id,
              item_id: orderItem.item_id,
              change: -orderItem.quantity,
              reason: `Order ${data.id} completed`,
              created_by: profile.id,
            });
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

