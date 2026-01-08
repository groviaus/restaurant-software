import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// UPDATE permissions for a role (Bulk Upsert)
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { role_id, permissions } = body;
    // permissions: { module_id, can_view, can_create, can_edit, can_delete }[]

    if (!role_id || !Array.isArray(permissions)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createClient();

    // We can use upsert to handle both insert and update
    const payload = permissions.map(p => ({
        role_id,
        module_id: p.module_id,
        can_view: p.can_view ?? false,
        can_create: p.can_create ?? false,
        can_edit: p.can_edit ?? false,
        can_delete: p.can_delete ?? false,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('role_permissions')
        .upsert(payload, { onConflict: 'role_id, module_id' })
        .select();

    if (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length });
}
