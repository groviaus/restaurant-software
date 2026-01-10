import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession, requirePermission } from '@/lib/auth';
import { z } from 'zod';

const createCategorySchema = z.object({
    outlet_id: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    display_order: z.number().int().default(0),
});

const updateCategorySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    display_order: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
    try {
        await requirePermission('menu', 'view');

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get('outlet_id');

        let query = supabase
            .from('categories')
            .select('*')
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

        return NextResponse.json({ categories: data || [] });
    } catch (error: any) {
        console.error('Categories API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch categories' },
            { status: 500 }
        );
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

        const createdCategories: any[] = [];
        const errors: any[] = [];

        // Create category for each outlet
        for (const targetOutletId of targetOutletIds) {
            try {
                const dataToValidate = { ...categoryData, outlet_id: targetOutletId };

                let validatedData;
                try {
                    validatedData = createCategorySchema.parse(dataToValidate);
                } catch (validationError: any) {
                    console.error('Validation error for outlet', targetOutletId, ':', validationError.errors);
                    errors.push({ outlet_id: targetOutletId, error: validationError.errors });
                    continue;
                }

                const insertData: any = { ...validatedData };

                const { data, error } = await supabase
                    .from('categories')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) {
                    console.error('Database error for outlet', targetOutletId, ':', error);
                    errors.push({ outlet_id: targetOutletId, error: error.message });
                } else {
                    createdCategories.push(data);
                }
            } catch (err: any) {
                console.error('Error creating category for outlet', targetOutletId, ':', err);
                errors.push({ outlet_id: targetOutletId, error: err.message });
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
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create category' },
            { status: 500 }
        );
    }
}
