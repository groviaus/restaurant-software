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

    // Update table status to EMPTY if dine-in (table is now available for new orders)
    if (data.table_id && data.order_type === 'DINE_IN') {
      await supabase
        .from('tables')
        .update({ status: 'EMPTY' })
        .eq('id', data.table_id);
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

