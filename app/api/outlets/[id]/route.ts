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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission('outlets', 'delete');
        const { id } = await params;
        const supabase = createServiceRoleClient();

        const { data, error: findError } = await supabase
            .from('outlets')
            .select('id, name')
            .eq('id', id)
            .single();

        const outlet = data as { id: string; name: string } | null;

        if (findError || !outlet) {
            return NextResponse.json(
                { error: 'Outlet not found' },
                { status: 404 }
            );
        }

        // 2. Clear current_outlet_id for any users currently active on this outlet
        await supabase
            .from('users')
            // @ts-expect-error - Supabase type inference issue
            .update({ current_outlet_id: null })
            .eq('current_outlet_id', id);

        // 3. Clear outlet_id for any users assigned directly to this outlet
        await supabase
            .from('users')
            // @ts-expect-error - Supabase type inference issue
            .update({ outlet_id: null })
            .eq('outlet_id', id);

        // 4. Delete the outlet
        const { error: deleteError } = await supabase
            .from('outlets')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message || 'Failed to delete outlet' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Outlet "${outlet.name}" deleted successfully`,
        });
    } catch (error: any) {
        console.error('Outlet delete error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete outlet' },
            { status: 500 }
        );
    }
}
