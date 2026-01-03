import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { createMenuItemSchema, updateMenuItemSchema, menuQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);

    // Preprocess query parameters - convert null/empty to undefined for optional fields
    const outletIdParam = searchParams.get('outlet_id');
    const rawQuery = {
      outlet_id: outletIdParam && outletIdParam.trim() !== '' ? outletIdParam : undefined,
      category: searchParams.get('category') || undefined,
      available: searchParams.get('available') || undefined,
    };

    let query;
    try {
      query = menuQuerySchema.parse(rawQuery);
    } catch (schemaError: any) {
      console.error('Schema validation error:', schemaError);
      // Provide more specific error message for UUID validation
      const errorMessage = schemaError.errors?.find((e: any) => e.path.includes('outlet_id'))
        ? 'Invalid outlet_id format. Must be a valid UUID.'
        : 'Invalid query parameters';
      return NextResponse.json(
        { error: errorMessage, details: schemaError.errors },
        { status: 400 }
      );
    }

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

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    return NextResponse.json(
      { error: error.message || 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

