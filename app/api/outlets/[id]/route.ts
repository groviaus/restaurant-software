import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission('outlets', 'view');
        const { id } = await params;
        const supabase = createServiceRoleClient();

        const { data: outlet, error } = await supabase
            .from('outlets')
            .select('id, name, address, created_at, updated_at')
            .eq('id', id)
            .single();

        if (error || !outlet) {
            return NextResponse.json(
                { error: 'Outlet not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(outlet);
    } catch (error: any) {
        console.error('Outlet fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch outlet' },
            { status: 500 }
        );
    }
}
