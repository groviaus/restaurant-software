import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { z } from 'zod';
import { recordMovement } from '@/lib/inventory/inventoryService';
import { InventoryTransactionType, StockCountStatus } from '@/lib/types';

const createCountSchema = z.object({
  notes: z.string().optional().nullable(),
  item_ids: z.array(z.string().uuid()).optional(), // If empty, include all active items
});

const updateCountSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(StockCountStatus).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    inventory_item_id: z.string().uuid(),
    physical_quantity: z.number().min(0),
    notes: z.string().optional().nullable(),
  })).optional(),
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
      // Single count with items
      const { data, error } = await (supabase as any)
        .from('stock_counts')
        .select(`
          *,
          stock_count_items (
            *,
            inventory_item:inventory_items (id, name, stock_unit, current_stock, category)
          )
        `)
        .eq('id', id)
        .eq('outlet_id', effectiveOutletId)
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ count: data });
    }

    // List all counts
    const { data, error } = await (supabase as any)
      .from('stock_counts')
      .select('*')
      .eq('outlet_id', effectiveOutletId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ counts: data ?? [] });
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
    const validated = createCountSchema.parse(body);
    const supabase = createServiceRoleClient();

    // Create count record
    const { data: count, error: countError } = await (supabase as any)
      .from('stock_counts')
      .insert({
        outlet_id: effectiveOutletId,
        status: 'draft',
        notes: validated.notes ?? null,
        counted_by: profile?.id ?? null,
      })
      .select()
      .single();

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
    const countData = count as any;

    // Get inventory items (all active, or specified)
    let itemsQuery = (supabase as any)
      .from('inventory_items')
      .select('id, name, current_stock, stock_unit')
      .eq('outlet_id', effectiveOutletId)
      .eq('active', true);

    if (validated.item_ids?.length) {
      itemsQuery = itemsQuery.in('id', validated.item_ids);
    }

    const { data: invItems } = await itemsQuery;
    const items = (invItems ?? []) as any[];

    // Create count items with system quantity snapshot
    if (items.length > 0) {
      const countItems = items.map((item) => ({
        stock_count_id: countData.id,
        inventory_item_id: item.id,
        system_quantity: Number(item.current_stock),
        unit: item.stock_unit,
      }));

      await (supabase as any).from('stock_count_items').insert(countItems);
    }

    return NextResponse.json({ count: countData }, { status: 201 });
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
    const validated = updateCountSchema.parse(body);
    const supabase = createServiceRoleClient();

    // Update count item physical quantities
    if (validated.items?.length) {
      for (const item of validated.items) {
        await (supabase as any)
          .from('stock_count_items')
          .update({
            physical_quantity: item.physical_quantity,
            notes: item.notes ?? null,
          })
          .eq('stock_count_id', validated.id)
          .eq('inventory_item_id', item.inventory_item_id);
      }
    }

    // If finalizing — create adjustment transactions for variances
    if (validated.status === StockCountStatus.FINALIZED) {
      const { data: countItems } = await (supabase as any)
        .from('stock_count_items')
        .select('*, inventory_item:inventory_items(name, stock_unit)')
        .eq('stock_count_id', validated.id);

      const items = (countItems ?? []) as any[];

      for (const ci of items) {
        if (ci.physical_quantity === null || ci.physical_quantity === undefined) continue;
        const variance = Number(ci.physical_quantity) - Number(ci.system_quantity);
        if (Math.abs(variance) < 0.001) continue; // Skip zero variance

        await recordMovement({
          outletId: effectiveOutletId,
          inventoryItemId: ci.inventory_item_id,
          transactionType: InventoryTransactionType.STOCK_COUNT_ADJUSTMENT,
          quantityChange: variance,
          unit: ci.unit,
          reason: `Stock count adjustment — Count #${validated.id.slice(0, 6).toUpperCase()}`,
          referenceType: 'stock_count',
          referenceId: validated.id,
          referenceLabel: `Count #${validated.id.slice(0, 6).toUpperCase()}`,
          createdBy: profile?.id,
          notes: `System: ${ci.system_quantity} → Physical: ${ci.physical_quantity}`,
          supabase,
        });
      }

      // Mark as finalized
      await (supabase as any)
        .from('stock_counts')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.id)
        .eq('outlet_id', effectiveOutletId);
    } else if (validated.status) {
      await (supabase as any)
        .from('stock_counts')
        .update({
          status: validated.status,
          notes: validated.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.id)
        .eq('outlet_id', effectiveOutletId);
    }

    const { data: updated } = await (supabase as any)
      .from('stock_counts')
      .select(`
        *,
        stock_count_items (
          *,
          inventory_item:inventory_items (id, name, stock_unit, current_stock)
        )
      `)
      .eq('id', validated.id)
      .single();

    return NextResponse.json({ count: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
