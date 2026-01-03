import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { createTableSchema, tablesQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const query = tablesQuerySchema.parse({
      outlet_id: searchParams.get('outlet_id'),
      status: searchParams.get('status'),
    });

    let queryBuilder = supabase
      .from('tables')
      .select('*')
      .order('name', { ascending: true });

    if (query.outlet_id) {
      queryBuilder = queryBuilder.eq('outlet_id', query.outlet_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return NextResponse.json({ tables: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const validatedData = createTableSchema.parse(body);

    const { data, error } = await supabase
      .from('tables')
      .insert(validatedData)
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
      { error: error.message || 'Failed to create table' },
      { status: 500 }
    );
  }
}

