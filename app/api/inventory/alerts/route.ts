import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function GET() {
  try {
    const profile = await getUserProfile();
    if (!profile?.outlet_id) {
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
      .eq('outlet_id', profile.outlet_id);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Filter low stock items
    const lowStock = (allInventory || []).filter(
      (inv) => inv.stock <= inv.low_stock_threshold
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alerts: lowStock || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}

