import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';
import { z } from 'zod';

const switchOutletSchema = z.object({
  outlet_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile();

    // Only admins can switch outlets
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can switch outlets.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { outlet_id } = switchOutletSchema.parse(body);

    const supabase = createServiceRoleClient();

    // Verify outlet exists
    const { data: outlet, error: outletError } = await supabase
      .from('outlets')
      .select('id, name')
      .eq('id', outlet_id)
      .single();

    if (outletError || !outlet) {
      return NextResponse.json(
        { error: 'Outlet not found' },
        { status: 404 }
      );
    }

    const outletData = outlet as { id: string; name: string };

    // Update current_outlet_id for the admin user
    const updateData: any = { current_outlet_id: outlet_id };
    const { error: updateError } = await supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
      .eq('id', profile.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to switch outlet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      outlet: {
        id: outletData.id,
        name: outletData.name,
      },
      message: `Switched to outlet: ${outletData.name}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to switch outlet' },
      { status: 500 }
    );
  }
}

