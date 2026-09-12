import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth , handleApiError } from '@/lib/auth';
import { createMenuItemSchema, updateMenuItemSchema, menuQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const query = menuQuerySchema.parse({
      outlet_id: searchParams.get('outlet_id'),
      category: searchParams.get('category'),
      available: searchParams.get('available'),
    });

    let queryBuilder = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (query.outlet_id) {
      queryBuilder = queryBuilder.eq('outlet_id', query.outlet_id);
    }

    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }

    if (query.available !== undefined) {
      queryBuilder = queryBuilder.eq('available', query.available);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return handleApiError(error, 'Failed to fetch menu items');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();
    
    const body = await request.json();
    const validatedData = createMenuItemSchema.parse(body);

    const insertData: any = validatedData;
    const { data, error } = await supabase
      .from('items')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error, 'Failed to create menu item');
  }
}

