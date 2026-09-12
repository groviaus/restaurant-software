import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId , handleApiError } from '@/lib/auth';
import { z } from 'zod';
import { recordMovement } from '@/lib/inventory/inventoryService';
import { InventoryTransactionType, PurchaseOrderStatus } from '@/lib/types';

const poItemSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity_ordered: z.number().positive(),
  unit: z.string().min(1),
  unit_price: z.number().min(0),
  notes: z.string().optional().nullable(),
});

const createPOSchema = z.object({
  supplier_id: z.string().uuid().optional().nullable(),
  supplier_name: z.string().optional().nullable(),
  order_date: z.string().optional(),
  expected_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1),
});

const receiveSchema = z.object({
  id: z.string().uuid(),
  items: z.array(z.object({
    purchase_order_item_id: z.string().uuid(),
    inventory_item_id: z.string().uuid(),
    quantity_received: z.number().min(0),
    unit: z.string(),
    unit_price: z.number().min(0),
    notes: z.string().optional().nullable(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const supabase = createServiceRoleClient();

    if (id) {
      const { data, error } = await (supabase as any)
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, contact_name, contact_phone),
          items:purchase_order_items (
            *,
            inventory_item:inventory_items(id, name, stock_unit)
          )
        `)
        .eq('id', id)
        .eq('outlet_id', effectiveOutletId)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ order: data });
    }

    const { data, error } = await (supabase as any)
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(id, name),
        items:purchase_order_items(id, quantity_ordered, quantity_received, unit_price)
      `)
      .eq('outlet_id', effectiveOutletId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('inventory', 'create');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });

    const body = await request.json();

    // Handle goods-received action
    if (body._action === 'receive') {
      const validated = receiveSchema.parse(body);
      const supabase = createServiceRoleClient();

      let totalReceived = 0;
      for (const item of validated.items) {
        if (item.quantity_received <= 0) continue;

        // Update PO item received qty
        await (supabase as any)
          .from('purchase_order_items')
          .update({ quantity_received: item.quantity_received })
          .eq('id', item.purchase_order_item_id);

        // Record inventory movement (stock in)
        await recordMovement({
          outletId: effectiveOutletId,
          inventoryItemId: item.inventory_item_id,
          transactionType: InventoryTransactionType.PURCHASE,
          quantityChange: item.quantity_received,
          unit: item.unit,
          reason: `Goods received — PO #${validated.id.slice(0, 6).toUpperCase()}`,
          referenceType: 'purchase_order',
          referenceId: validated.id,
          referenceLabel: `PO #${validated.id.slice(0, 6).toUpperCase()}`,
          createdBy: profile?.id,
          supabase,
        });

        // Update cost_per_unit if price given
        if (item.unit_price > 0) {
          await (supabase as any)
            .from('inventory_items')
            .update({ cost_per_unit: item.unit_price, updated_at: new Date().toISOString() })
            .eq('id', item.inventory_item_id);
        }

        totalReceived++;
      }

      // Check if fully received or partially
      const { data: poItems } = await (supabase as any)
        .from('purchase_order_items')
        .select('quantity_ordered, quantity_received')
        .eq('purchase_order_id', validated.id);

      const allReceived = (poItems ?? []).every(
        (i: any) => Number(i.quantity_received) >= Number(i.quantity_ordered)
      );

      await (supabase as any)
        .from('purchase_orders')
        .update({
          status: allReceived ? 'received' : 'partially_received',
          received_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.id);

      return NextResponse.json({ success: true, itemsReceived: totalReceived });
    }

    // Create new PO
    const validated = createPOSchema.parse(body);
    const supabase = createServiceRoleClient();

    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.quantity_ordered * item.unit_price, 0
    );

    const { data: po, error: poError } = await (supabase as any)
      .from('purchase_orders')
      .insert({
        outlet_id: effectiveOutletId,
        supplier_id: validated.supplier_id ?? null,
        supplier_name: validated.supplier_name ?? null,
        status: 'draft',
        order_date: validated.order_date ?? new Date().toISOString().split('T')[0],
        expected_date: validated.expected_date ?? null,
        notes: validated.notes ?? null,
        total_amount: totalAmount,
        created_by: profile?.id ?? null,
      })
      .select()
      .single();

    if (poError) return NextResponse.json({ error: poError.message }, { status: 500 });
    const poData = po as any;

    const poItems = validated.items.map((item) => ({
      purchase_order_id: poData.id,
      inventory_item_id: item.inventory_item_id,
      quantity_ordered: item.quantity_ordered,
      quantity_received: 0,
      unit: item.unit,
      unit_price: item.unit_price,
      notes: item.notes ?? null,
    }));

    await (supabase as any).from('purchase_order_items').insert(poItems);

    return NextResponse.json({ order: poData }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission('inventory', 'edit');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });

    const body = await request.json();
    const { id, status, notes } = body;
    if (!id) return NextResponse.json({ error: 'PO id required' }, { status: 400 });

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase as any)
      .from('purchase_orders')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('outlet_id', effectiveOutletId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
