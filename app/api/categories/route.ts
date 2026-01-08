import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession, getUserProfile } from '@/lib/auth';
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
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

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
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const profile = await getUserProfile();
        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        const supabase = await createClient();
        const body = await request.json();
        const validatedData = createCategorySchema.parse(body);

        const { data, error } = await supabase
            .from('categories')
            .insert(validatedData)
            .select()
            .single();

        if (error) {
            console.error('Category creation error:', error);
            throw error;
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create category' },
            { status: 500 }
        );
    }
}
