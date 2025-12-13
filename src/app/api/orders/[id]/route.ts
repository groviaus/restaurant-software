import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { updateOrderStatusSchema, orderIdSchema } from '@/lib/schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const { id } = orderIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: validatedData.status,
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

    // Update table status if order is completed or cancelled
    if (data.table_id && (validatedData.status === 'COMPLETED' || validatedData.status === 'CANCELLED')) {
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
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

