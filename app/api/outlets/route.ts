import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';
import { z } from 'zod';

const createOutletSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

export async function GET() {
  try {
    const profile = await getUserProfile();
    const supabase = createServiceRoleClient();

    // Admins can see all outlets, others see only their outlet
    if (profile?.role === 'admin') {
      const { data: outlets, error } = await supabase
        .from('outlets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ outlets: outlets || [] });
    } else if (profile?.outlet_id) {
      const { data: outlet, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('id', profile.outlet_id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ outlets: outlet ? [outlet] : [] });
    }

    return NextResponse.json({ outlets: [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch outlets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createOutletSchema.parse(body);

    const supabase = createServiceRoleClient();
    const insertData: any = {
      name: validated.name,
      address: validated.address,
    };
    const { data: outlet, error } = await supabase
      .from('outlets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ outlet });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create outlet' },
      { status: 500 }
    );
  }
}

