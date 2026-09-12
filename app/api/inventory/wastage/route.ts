import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId , handleApiError } from '@/lib/auth';
import { z } from 'zod';
import { recordMovement } from '@/lib/inventory/inventoryService';
import { InventoryTransactionType } from '@/lib/types';

const wastageSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  reason: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    await requirePermission('inventory', 'edit');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });

    const body = await request.json();
    const validated = wastageSchema.parse(body);
    const supabase = createServiceRoleClient();

    // Determine the specific transaction type from reason
    let txType = InventoryTransactionType.WASTAGE;
    const reasonLower = validated.reason.toLowerCase();
    if (reasonLower.includes('spoil')) txType = InventoryTransactionType.SPOILAGE;
    else if (reasonLower.includes('damage') || reasonLower.includes('dropped')) txType = InventoryTransactionType.DAMAGE;

    await recordMovement({
      outletId: effectiveOutletId,
      inventoryItemId: validated.inventory_item_id,
      transactionType: txType,
      quantityChange: -validated.quantity, // always negative for wastage
      unit: validated.unit,
      reason: validated.reason,
      referenceType: 'wastage',
      createdBy: profile?.id,
      notes: validated.notes ?? undefined,
      supabase,
    });

    // Fetch updated item for response
    const { data: item } = await supabase
      .from('inventory_items')
      .select('id, name, current_stock, stock_unit')
      .eq('id', validated.inventory_item_id)
      .single();

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });

    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_item:inventory_items(id, name, stock_unit)
      `)
      .eq('outlet_id', effectiveOutletId)
      .in('transaction_type', ['wastage', 'spoilage', 'damage'])
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ movements: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
