import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { z } from 'zod';

const createItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  item_type: z.enum(['raw_material', 'ingredient', 'prepared_item', 'packaging', 'other']).default('ingredient'),
  stock_unit: z.string().min(1).default('pcs'),
  purchase_unit: z.string().optional().nullable(),
  unit_conversion_factor: z.number().positive().default(1),
  min_stock: z.number().min(0).default(0),
  reorder_level: z.number().min(0).default(0),
  par_level: z.number().min(0).default(0),
  cost_per_unit: z.number().min(0).default(0),
  active: z.boolean().default(true),
  supplier_name: z.string().optional().nullable(),
  storage_location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().uuid(),
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
    const activeOnly = searchParams.get('active') !== 'false';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const supabase = createServiceRoleClient();
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('outlet_id', effectiveOutletId)
      .order('name', { ascending: true });

    if (activeOnly) query = query.eq('active', true);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch inventory items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('inventory', 'create');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createItemSchema.parse(body);

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase as any)
      .from('inventory_items')
      .insert({ ...validated, outlet_id: effectiveOutletId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || 'Failed to create inventory item' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission('inventory', 'edit');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateItemSchema.parse(body);
    const { id, ...updates } = validated;

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase as any)
      .from('inventory_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('outlet_id', effectiveOutletId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ item: data });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('inventory', 'delete');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const supabase = createServiceRoleClient();
    // Soft-delete: mark inactive instead of hard delete to preserve ledger integrity
    const { error } = await (supabase as any)
      .from('inventory_items')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('outlet_id', effectiveOutletId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete inventory item' }, { status: 500 });
  }
}
