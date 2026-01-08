import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { z } from 'zod';

const settingsSchema = z.object({
    // Tax Settings
    gst_enabled: z.boolean().optional(),
    gst_percentage: z.number().min(0).max(100).optional(),
    cgst_percentage: z.number().min(0).max(100).optional(),
    sgst_percentage: z.number().min(0).max(100).optional(),

    // Business Info
    business_name: z.string().max(255).optional().nullable(),
    gstin: z.string().max(15).optional().nullable(),
    address_line1: z.string().max(255).optional().nullable(),
    address_line2: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    pincode: z.string().max(10).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),

    // Receipt/Bill Settings
    receipt_header: z.string().optional().nullable(),
    receipt_footer: z.string().optional().nullable(),
    show_gstin_on_bill: z.boolean().optional(),
    show_address_on_bill: z.boolean().optional(),

    // Order Settings
    default_order_type: z.enum(['DINE_IN', 'TAKEAWAY']).optional(),
    auto_print_bill: z.boolean().optional(),
    allow_takeaway: z.boolean().optional(),
    allow_dine_in: z.boolean().optional(),

    // Currency Settings
    currency_symbol: z.string().max(10).optional(),
    currency_code: z.string().max(3).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getUserProfile();
        const outletId = getEffectiveOutletId(profile);

        if (!outletId) {
            return NextResponse.json({ error: 'No outlet selected' }, { status: 400 });
        }

        const supabase = await createClient();

        // Get settings for the current outlet
        const { data, error } = await supabase
            .from('outlet_settings')
            .select('*')
            .eq('outlet_id', outletId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching settings:', error);
            throw error;
        }

        // If no settings exist, return defaults
        if (!data) {
            return NextResponse.json({
                settings: {
                    outlet_id: outletId,
                    gst_enabled: true,
                    gst_percentage: 18,
                    cgst_percentage: 9,
                    sgst_percentage: 9,
                    currency_symbol: '₹',
                    currency_code: 'INR',
                    allow_takeaway: true,
                    allow_dine_in: true,
                    default_order_type: 'DINE_IN',
                    show_gstin_on_bill: true,
                    show_address_on_bill: true,
                }
            });
        }

        return NextResponse.json({ settings: data });
    } catch (error: any) {
        console.error('Settings GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getUserProfile();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const outletId = getEffectiveOutletId(profile);
        if (!outletId) {
            return NextResponse.json({ error: 'No outlet selected' }, { status: 400 });
        }

        const supabase = await createClient();
        const body = await request.json();

        // Validate the settings
        const validatedData = settingsSchema.parse(body);

        // Upsert settings
        const { data, error } = await supabase
            .from('outlet_settings')
            .upsert({
                outlet_id: outletId,
                ...validatedData,
                updated_at: new Date().toISOString(),
            } as any, {
                onConflict: 'outlet_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving settings:', error);
            throw error;
        }

        return NextResponse.json({ settings: data });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }
        console.error('Settings POST error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save settings' },
            { status: 500 }
        );
    }
}
