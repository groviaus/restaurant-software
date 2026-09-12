import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId , handleApiError } from '@/lib/auth';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });

    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase as any)
      .from('suppliers')
      .select('*')
      .eq('outlet_id', effectiveOutletId)
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ suppliers: data ?? [] });
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
    const validated = supplierSchema.parse(body);
    const supabase = createServiceRoleClient();

    const { data, error } = await (supabase as any)
      .from('suppliers')
      .insert({
        outlet_id: effectiveOutletId,
        name: validated.name,
        contact_name: validated.contact_name ?? null,
        contact_phone: validated.contact_phone ?? null,
        contact_email: validated.contact_email || null,
        address: validated.address ?? null,
        notes: validated.notes ?? null,
        active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ supplier: data }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
