import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';
import { z } from 'zod';

const updateInventorySchema = z.object({
  item_id: z.string().uuid(),
  stock: z.number().min(0),
  low_stock_threshold: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    if (!profile?.outlet_id) {
      return NextResponse.json(
        { error: 'User not assigned to an outlet' },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        item:items(*)
      `)
      .eq('outlet_id', profile.outlet_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inventory: inventory || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    if (!profile?.outlet_id) {
      return NextResponse.json(
        { error: 'User not assigned to an outlet' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateInventorySchema.parse(body);

    const supabase = createServiceRoleClient();

    // Check if inventory exists
    const { data: existing } = await supabase
      .from('inventory')
      .select('*')
      .eq('outlet_id', profile.outlet_id)
      .eq('item_id', validated.item_id)
      .single();

    if (existing) {
      // Update existing
      const oldStock = existing.stock;
      const { data: updated, error } = await supabase
        .from('inventory')
        .update({
          stock: validated.stock,
          low_stock_threshold: validated.low_stock_threshold ?? existing.low_stock_threshold,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the change
      await supabase.from('inventory_logs').insert({
        outlet_id: profile.outlet_id,
        item_id: validated.item_id,
        change: validated.stock - oldStock,
        reason: 'Manual adjustment',
        created_by: profile.id,
      });

      return NextResponse.json({ inventory: updated });
    } else {
      // Create new
      const { data: created, error } = await supabase
        .from('inventory')
        .insert({
          outlet_id: profile.outlet_id,
          item_id: validated.item_id,
          stock: validated.stock,
          low_stock_threshold: validated.low_stock_threshold ?? 10,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the change
      await supabase.from('inventory_logs').insert({
        outlet_id: profile.outlet_id,
        item_id: validated.item_id,
        change: validated.stock,
        reason: 'Initial stock',
        created_by: profile.id,
      });

      return NextResponse.json({ inventory: created });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

