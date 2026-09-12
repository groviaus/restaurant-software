import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission, handleApiError } from '@/lib/auth';
import { z } from 'zod';

const createCategorySchema = z.object({
    outlet_id: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    display_order: z.number().int().default(0),
});

export async function GET(request: NextRequest) {
    try {
        await requirePermission('menu', 'view');

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get('outlet_id');

        let query = supabase
            .from('categories')
            .select(`
                *,
                items (id)
            `)
            .order('display_order', { ascending: true })
            .order('name', { ascending: true });

        if (outletId) {
            query = query.eq('outlet_id', outletId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Categories fetch error:', error);
            throw error;
        }

        const categoriesWithCount = (data || []).map((cat: Record<string, unknown>) => {
            const items = cat.items;
            const rest = { ...cat };
            delete rest.items;
            return {
                ...rest,
                items_count: Array.isArray(items) ? items.length : 0,
            };
        });

        return NextResponse.json(
            { categories: categoriesWithCount },
            {
                headers: {
                    'Cache-Control': 'private, max-age=20, stale-while-revalidate=59',
                },
            }
        );
    } catch (error: unknown) {
        console.error('Categories API error:', error);
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requirePermission('menu', 'create');

        const supabase = await createClient();
        const body = await request.json();

        // Extract outlet_ids for multi-outlet creation
        const { outlet_ids, outlet_id, ...categoryData } = body;

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

        const createdCategories: Record<string, unknown>[] = [];
        const errors: { outlet_id: string; error: unknown }[] = [];

        // Create category for each outlet
        for (const targetOutletId of targetOutletIds) {
            try {
                const dataToValidate = { ...categoryData, outlet_id: targetOutletId };

                let validatedData;
                try {
                    validatedData = createCategorySchema.parse(dataToValidate);
                } catch (validationError: unknown) {
                    const issues = validationError instanceof z.ZodError ? validationError.issues : [];
                    console.error('Validation error for outlet', targetOutletId, ':', issues);
                    errors.push({ outlet_id: targetOutletId, error: issues });
                    continue;
                }

                const insertData = { ...validatedData };

                const { data, error } = await supabase
                    .from('categories')
                    // @ts-expect-error - Supabase type inference issue
                    .insert(insertData)
                    .select()
                    .single();

                if (error) {
                    console.error('Database error for outlet', targetOutletId, ':', error);
                    errors.push({ outlet_id: targetOutletId, error: error.message });
                } else if (data) {
                    createdCategories.push(data);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.error('Error creating category for outlet', targetOutletId, ':', err);
                errors.push({ outlet_id: targetOutletId, error: message });
            }
        }

        if (createdCategories.length === 0 && errors.length > 0) {
            return NextResponse.json(
                { error: 'Failed to create categories', details: errors },
                { status: 400 }
            );
        }

        // Return the first created category for backward compatibility, but include count
        return NextResponse.json(
            {
                ...createdCategories[0],
                _meta: {
                    created_count: createdCategories.length,
                    error_count: errors.length,
                    errors: errors.length > 0 ? errors : undefined
                }
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }
        console.error('Category creation error:', error);
        return handleApiError(error);
    }
}
