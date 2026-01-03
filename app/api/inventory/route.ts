import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { z } from 'zod';

const updateInventorySchema = z.object({
  item_id: z.string().uuid(),
  stock: z.number().min(0),
  low_stock_threshold: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
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
      .eq('outlet_id', effectiveOutletId)
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
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
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
      .eq('outlet_id', effectiveOutletId)
      .eq('item_id', validated.item_id)
      .single();

    if (existing) {
      // Update existing
      const existingData = existing as any;
      const oldStock = existingData.stock;
      const updateData: any = {
        stock: validated.stock,
        low_stock_threshold: validated.low_stock_threshold ?? existingData.low_stock_threshold,
      };
      const { data: updated, error } = await supabase
        .from('inventory')
        // @ts-expect-error - Supabase type inference issue
        .update(updateData)
        .eq('id', existingData.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the change
      const logData: any = {
        outlet_id: effectiveOutletId,
        item_id: validated.item_id,
        change: validated.stock - oldStock,
        reason: 'Manual adjustment',
        created_by: profile.id,
      };
      await supabase.from('inventory_logs').insert(logData);

      return NextResponse.json({ inventory: updated });
    } else {
      // Create new
      const insertData: any = {
        outlet_id: effectiveOutletId,
        item_id: validated.item_id,
        stock: validated.stock,
        low_stock_threshold: validated.low_stock_threshold ?? 10,
      };
      const { data: created, error } = await supabase
        .from('inventory')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the change
      const initialLogData: any = {
        outlet_id: effectiveOutletId,
        item_id: validated.item_id,
        change: validated.stock,
        reason: 'Initial stock',
        created_by: profile.id,
      };
      await supabase.from('inventory_logs').insert(initialLogData);

      return NextResponse.json({ inventory: created });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

