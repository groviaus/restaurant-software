import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { orderIdSchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const { id } = orderIdSchema.parse({ id: params.id });

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

    return NextResponse.json(orderData);
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

