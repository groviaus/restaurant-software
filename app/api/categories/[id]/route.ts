import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession, getUserProfile } from '@/lib/auth';
import { z } from 'zod';

const updateCategorySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    display_order: z.number().int().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();
        const validatedData = updateCategorySchema.parse(body);
        const updateData: any = {
            ...validatedData,
        };

        const { data, error } = await supabase
            .from('categories')
            // @ts-expect-error - Supabase type inference issue
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Category update error:', error);
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to update category' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Category deletion error:', error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to delete category' },
            { status: 500 }
        );
    }
}
