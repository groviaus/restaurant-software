import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';

export async function GET() {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json(
        { error: 'User not assigned to an outlet' },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get items with low stock
    const { data: allInventory, error: fetchError } = await supabase
      .from('inventory')
      .select(`
        *,
        item:items(*)
      `)
      .eq('outlet_id', effectiveOutletId);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Filter low stock items
    const lowStock = (allInventory || []).filter(
      (inv: any) => inv.stock <= inv.low_stock_threshold
    );

    return NextResponse.json({ alerts: lowStock || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}

