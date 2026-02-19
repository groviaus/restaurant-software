import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'User not assigned to an outlet' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: logs, error } = await supabase
      .from('inventory_logs')
      .select(`*, item:items(*)`)
      .eq('outlet_id', effectiveOutletId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory logs' },
      { status: 500 }
    );
  }
}
