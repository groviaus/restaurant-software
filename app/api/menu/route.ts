import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { createMenuItemSchema, menuQuerySchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletIdParam = searchParams.get('outlet_id');

    // Allow public access if outlet_id is provided (for QR menu)
    // Otherwise require view permission
    if (!outletIdParam) {
      await requirePermission('menu', 'view');
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
    } catch (schemaError: unknown) {
      console.error('Schema validation error:', schemaError);
      const isZod = schemaError instanceof ZodError;
      const errorMessage = isZod && schemaError.issues.some((e) => e.path.includes('outlet_id'))
        ? 'Invalid outlet_id format. Must be a valid UUID.'
        : 'Invalid query parameters';
      return NextResponse.json(
        { error: errorMessage, details: isZod ? schemaError.issues : undefined },
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
  } catch (error: unknown) {
    console.error('Menu API error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch menu items';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('menu', 'create');

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

    const createdItems: Record<string, unknown>[] = [];
    const errors: { outlet_id: string; error: string; details?: unknown }[] = [];

    // Create item for each outlet
    for (const targetOutletId of targetOutletIds) {
      try {
        const dataToValidate = { ...itemData, outlet_id: targetOutletId };

        let validatedData;
        try {
          validatedData = createMenuItemSchema.parse(dataToValidate);
        } catch (validationError: unknown) {
          const isZod = validationError instanceof ZodError;
          const issues = isZod ? validationError.issues : [];
          const formattedMessage = issues.length > 0
            ? issues.map((i) => `${i.path?.join('.') || 'field'}: ${i.message}`).join(', ')
            : validationError instanceof Error
              ? validationError.message
              : 'Validation error';
          console.error('Validation error for outlet', targetOutletId, ':', formattedMessage);
          errors.push({ outlet_id: targetOutletId, error: formattedMessage, details: issues });
          continue;
        }

        // Ensure image_url is null if empty
        const insertData = {
          ...validatedData,
          image_url: validatedData.image_url || null,
        };

        const { data, error } = await supabase
          .from('items')
          .insert(insertData as never)
          .select()
          .single();

        if (error) {
          console.error('Database error for outlet', targetOutletId, ':', error);
          errors.push({ outlet_id: targetOutletId, error: error.message });
        } else if (data) {
          createdItems.push(data as Record<string, unknown>);
        }
      } catch (err: unknown) {
        console.error('Error creating item for outlet', targetOutletId, ':', err);
        const msg = err instanceof Error ? err.message : 'Failed to create item';
        errors.push({ outlet_id: targetOutletId, error: msg });
      }
    }

    if (createdItems.length === 0 && errors.length > 0) {
      const firstError = errors[0]?.error || 'Failed to create menu items';
      return NextResponse.json(
        { error: typeof firstError === 'string' ? firstError : 'Failed to create menu items', details: errors },
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
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Menu POST error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    const msg = error instanceof Error ? error.message : 'Failed to create menu item';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
