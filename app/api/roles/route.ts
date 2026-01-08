import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET all roles
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();
    const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(roles);
}

// CREATE new role
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // TODO: Add stricter admin check here if needed (via RBAC or role check)

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
        return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const insertData: any = { name, description };
    const { data: role, error } = await supabase
        .from('roles')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(role, { status: 201 });
}
