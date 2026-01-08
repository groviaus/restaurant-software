import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET all users with roles
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Verify if the current user is an admin
    const { data: currentUserProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

    // Cast to any to avoid TS error if types are not up to date
    if ((currentUserProfile as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Use service role to fetch all users (bypassing RLS)
    const supabaseAdmin = createServiceRoleClient();

    // Need to left join with roles table to get role names
    // Supabase join syntax: select('*, roles(*)')
    const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*, roles(name)')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(users);
}

// CREATE User (Admin only)
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { email, password, name, role_id, outlet_id } = body;

    if (!email || !password || !name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use Service Role to create auth user
    const supabaseAdmin = createServiceRoleClient();

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
    });

    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authData.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // 2. Update Public Users Table with Role and Outlet
    const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
            id: authData.user.id,
            email,
            name,
            role: 'staff', // Default fallback role string
            role_id: role_id || null, // Custom role ID
            outlet_id: outlet_id || null
        } as any);

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ user: authData.user }, { status: 201 });
}
