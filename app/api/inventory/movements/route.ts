import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId , handleApiError } from '@/lib/auth';
import { z } from 'zod';
import { recordMovement } from '@/lib/inventory/inventoryService';
import { InventoryTransactionType } from '@/lib/types';

const recordMovementSchema = z.object({
  inventory_item_id: z.string().uuid(),
  transaction_type: z.nativeEnum(InventoryTransactionType),
  quantity_change: z.number(),
  unit: z.string().min(1),
  reason: z.string().optional().nullable(),
  reference_type: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
  reference_label: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const transactionType = searchParams.get('transaction_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') ?? '100');

    const supabase = createServiceRoleClient();
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_item:inventory_items (id, name, stock_unit)
      `)
      .eq('outlet_id', effectiveOutletId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (itemId) query = query.eq('inventory_item_id', itemId);
    if (transactionType) query = query.eq('transaction_type', transactionType);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ movements: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch movements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('inventory', 'edit');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const body = await request.json();
    const validated = recordMovementSchema.parse(body);

    const supabase = createServiceRoleClient();

    await recordMovement({
      outletId: effectiveOutletId,
      inventoryItemId: validated.inventory_item_id,
      transactionType: validated.transaction_type,
      quantityChange: validated.quantity_change,
      unit: validated.unit,
      reason: validated.reason ?? undefined,
      referenceType: validated.reference_type ?? undefined,
      referenceId: validated.reference_id ?? undefined,
      referenceLabel: validated.reference_label ?? undefined,
      createdBy: profile?.id ?? undefined,
      notes: validated.notes ?? undefined,
      supabase,
    });

    // Fetch updated item
    const { data: updatedItem } = await supabase
      .from('inventory_items')
      .select('id, current_stock, stock_unit, name')
      .eq('id', validated.inventory_item_id)
      .single();

    return NextResponse.json({ success: true, item: updatedItem }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || 'Failed to record movement' }, { status: 500 });
  }
}
