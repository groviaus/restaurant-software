import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { updateTableSchema, tableIdSchema } from '@/lib/schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { id: paramsId } = await params;
    const { id } = tableIdSchema.parse({ id: paramsId });
    const body = await request.json();
    const validatedData = updateTableSchema.parse(body);

    const { data, error } = await supabase
      .from('tables')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update table' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { id: paramsId } = await params;
    const { id } = tableIdSchema.parse({ id: paramsId });

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete table' },
      { status: 500 }
    );
  }
}

