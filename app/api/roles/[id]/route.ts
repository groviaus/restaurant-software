import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET single role with permissions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = await createClient();

    // Fetch role details
    const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

    if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    // Fetch role permissions
    const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select('*, modules(*)')
        .eq('role_id', id);

    if (permError) {
        return NextResponse.json({ error: permError.message }, { status: 500 });
    }

    return NextResponse.json({ ...(role as any), permissions });
}

// UPDATE role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const supabase = await createClient();
    const updateData: any = { name, description };
    const { data: role, error } = await supabase
        .from('roles')
        // @ts-expect-error - Supabase type inference issue
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(role);
}

// DELETE role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
