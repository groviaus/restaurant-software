import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// UPDATE User (Change role/outlet)
// UPDATE User (Change role/outlet)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, role_id, outlet_id, password } = body;

    const supabaseAdmin = createServiceRoleClient(); // Use service role for all admin operations

    // 1. Update Profile (Role, Name, Outlet)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (outlet_id !== undefined) updateData.outlet_id = outlet_id;

    if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin
            .from('users')
            // @ts-expect-error - Supabase type inference issue
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
    }

    // 2. Update Password if provided (requires admin privileges on auth)
    if (password) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
            id,
            { password }
        );

        if (passwordError) {
            return NextResponse.json({ error: passwordError.message }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

// DELETE User
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabaseAdmin = createServiceRoleClient();

    // Deleting from auth.users cascades to public.users usually
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
