import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getEffectiveOutletId, getUserProfile , handleApiError } from '@/lib/auth';
import { getMenuAvailability } from '@/lib/inventory/inventoryService';

/**
 * GET /api/inventory/availability
 *
 * Returns inventory availability status for one or more menu items.
 * Used by:
 *  - OrderForm (real-time availability badges)
 *  - Menu management (availability status column)
 *
 * Query params:
 *   outlet_id (optional override)
 *   menu_item_ids (comma-separated list of menu item UUIDs)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletOverride = searchParams.get('outlet_id');
    const profile = await getUserProfile();
    const effectiveOutletId = outletOverride || getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }
    const idsParam = searchParams.get('menu_item_ids');

    if (!idsParam) {
      return NextResponse.json({ availability: {} });
    }

    const menuItemIds = idsParam.split(',').filter(Boolean);
    const supabase = createServiceRoleClient();

    const availability = await getMenuAvailability(menuItemIds, effectiveOutletId, supabase);

    return NextResponse.json({ availability });
  } catch (err: any) {
    console.error('[Availability API] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
