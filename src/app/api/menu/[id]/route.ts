import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth , handleApiError } from '@/lib/auth';
import { updateMenuItemSchema, menuItemIdSchema } from '@/lib/schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const { id } = menuItemIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validatedData = updateMenuItemSchema.parse(body);

    const updateData: any = { ...validatedData, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('items')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
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
    return handleApiError(error, 'Failed to update menu item');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const { id } = menuItemIdSchema.parse({ id: params.id });

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error, 'Failed to delete menu item');
  }
}

