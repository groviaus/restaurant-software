import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { createMenuItemSchema, menuQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletIdParam = searchParams.get('outlet_id');

    // Allow public access if outlet_id is provided (for QR menu)
    // Otherwise require authentication
    if (!outletIdParam) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const supabase = await createClient();

    // Preprocess query parameters - convert null/empty to undefined for optional fields
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
    console.log('Received menu item data:', JSON.stringify(body, null, 2));

    // Extract outlet_ids for multi-outlet creation
    const { outlet_ids, outlet_id, ...itemData } = body;

    // Determine target outlets
    const targetOutletIds: string[] = outlet_ids && Array.isArray(outlet_ids)
      ? outlet_ids
      : outlet_id
        ? [outlet_id]
        : [];

    if (targetOutletIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one outlet_id is required' },
        { status: 400 }
      );
    }

    const createdItems: any[] = [];
    const errors: any[] = [];

    // Create item for each outlet
    for (const targetOutletId of targetOutletIds) {
      try {
        const dataToValidate = { ...itemData, outlet_id: targetOutletId };

        let validatedData;
        try {
          validatedData = createMenuItemSchema.parse(dataToValidate);
        } catch (validationError: any) {
          console.error('Validation error for outlet', targetOutletId, ':', validationError.errors);
          errors.push({ outlet_id: targetOutletId, error: validationError.errors });
          continue;
        }

        // Ensure image_url is null if empty
        const insertData: any = {
          ...validatedData,
          image_url: validatedData.image_url || null,
        };

        const { data, error } = await supabase
          .from('items')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Database error for outlet', targetOutletId, ':', error);
          errors.push({ outlet_id: targetOutletId, error: error.message });
        } else {
          createdItems.push(data);
        }
      } catch (err: any) {
        console.error('Error creating item for outlet', targetOutletId, ':', err);
        errors.push({ outlet_id: targetOutletId, error: err.message });
      }
    }

    if (createdItems.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to create menu items', details: errors },
        { status: 400 }
      );
    }

    // Return the first created item for backward compatibility, but include count
    return NextResponse.json(
      {
        ...createdItems[0],
        _meta: {
          created_count: createdItems.length,
          error_count: errors.length,
          errors: errors.length > 0 ? errors : undefined
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Menu POST error:', error);
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
