import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { z } from 'zod';

// Type for global settings
type GlobalSettings = {
    gst_enabled?: boolean;
    gst_percentage?: number;
    cgst_percentage?: number;
    sgst_percentage?: number;
} | null;

// Type for outlet settings
type OutletSettings = {
    business_name?: string | null;
    gstin?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    email?: string | null;
    receipt_header?: string | null;
    receipt_footer?: string | null;
    show_gstin_on_bill?: boolean;
    show_address_on_bill?: boolean;
    default_order_type?: 'DINE_IN' | 'TAKEAWAY';
    auto_print_bill?: boolean;
    allow_takeaway?: boolean;
    allow_dine_in?: boolean;
    currency_symbol?: string;
    currency_code?: string;
} | null;

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

        // Get global GST settings (same for all outlets)
        const { data: globalSettings } = await supabase
            .from('global_settings')
            .select('gst_enabled, gst_percentage, cgst_percentage, sgst_percentage')
            .eq('id', 'global')
            .single();

        // Type assertion for global settings
        const typedGlobalSettings = globalSettings as GlobalSettings;

        // Get outlet-specific settings (business info, receipt settings, etc.)
        const { data: outletData, error } = await supabase
            .from('outlet_settings')
            .select('*')
            .eq('outlet_id', outletId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching settings:', error);
            throw error;
        }

        // Type assertion for outlet settings
        const typedOutletData = outletData as OutletSettings;

        // Merge global GST settings with outlet-specific settings
        const mergedSettings = {
            outlet_id: outletId,
            // GST from global settings
            gst_enabled: typedGlobalSettings?.gst_enabled ?? true,
            gst_percentage: typedGlobalSettings?.gst_percentage ?? 18,
            cgst_percentage: typedGlobalSettings?.cgst_percentage ?? 9,
            sgst_percentage: typedGlobalSettings?.sgst_percentage ?? 9,
            // Outlet-specific settings
            business_name: typedOutletData?.business_name ?? null,
            gstin: typedOutletData?.gstin ?? null,
            address_line1: typedOutletData?.address_line1 ?? null,
            address_line2: typedOutletData?.address_line2 ?? null,
            city: typedOutletData?.city ?? null,
            state: typedOutletData?.state ?? null,
            pincode: typedOutletData?.pincode ?? null,
            phone: typedOutletData?.phone ?? null,
            email: typedOutletData?.email ?? null,
            receipt_header: typedOutletData?.receipt_header ?? null,
            receipt_footer: typedOutletData?.receipt_footer ?? null,
            show_gstin_on_bill: typedOutletData?.show_gstin_on_bill ?? true,
            show_address_on_bill: typedOutletData?.show_address_on_bill ?? true,
            default_order_type: typedOutletData?.default_order_type ?? 'DINE_IN',
            auto_print_bill: typedOutletData?.auto_print_bill ?? false,
            allow_takeaway: typedOutletData?.allow_takeaway ?? true,
            allow_dine_in: typedOutletData?.allow_dine_in ?? true,
            currency_symbol: typedOutletData?.currency_symbol ?? '₹',
            currency_code: typedOutletData?.currency_code ?? 'INR',
        };

        return NextResponse.json({ settings: mergedSettings });
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

        // Separate GST settings (global) from outlet-specific settings
        const {
            gst_enabled,
            gst_percentage,
            cgst_percentage,
            sgst_percentage,
            ...outletSpecificSettings
        } = validatedData;

        // Update global GST settings if provided
        if (gst_enabled !== undefined || gst_percentage !== undefined || 
            cgst_percentage !== undefined || sgst_percentage !== undefined) {
            const globalUpdate: any = {};
            if (gst_enabled !== undefined) globalUpdate.gst_enabled = gst_enabled;
            if (gst_percentage !== undefined) globalUpdate.gst_percentage = gst_percentage;
            if (cgst_percentage !== undefined) globalUpdate.cgst_percentage = cgst_percentage;
            if (sgst_percentage !== undefined) globalUpdate.sgst_percentage = sgst_percentage;

            const { error: globalError } = await supabase
                .from('global_settings')
                .upsert({
                    id: 'global',
                    ...globalUpdate,
                    updated_at: new Date().toISOString(),
                } as any, {
                    onConflict: 'id'
                });

            if (globalError) {
                console.error('Error saving global GST settings:', globalError);
                throw globalError;
            }
        }

        // Update outlet-specific settings
        if (Object.keys(outletSpecificSettings).length > 0) {
            const { data, error } = await supabase
                .from('outlet_settings')
                .upsert({
                    outlet_id: outletId,
                    ...outletSpecificSettings,
                    updated_at: new Date().toISOString(),
                } as any, {
                    onConflict: 'outlet_id'
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving outlet settings:', error);
                throw error;
            }
        }

        // Return merged settings (fetch fresh to ensure consistency)
        const { data: freshGlobalSettings } = await supabase
            .from('global_settings')
            .select('gst_enabled, gst_percentage, cgst_percentage, sgst_percentage')
            .eq('id', 'global')
            .single();

        const { data: outletData } = await supabase
            .from('outlet_settings')
            .select('*')
            .eq('outlet_id', outletId)
            .single();

        // Type assertions
        const typedFreshGlobalSettings = freshGlobalSettings as GlobalSettings;
        const typedOutletData = outletData as OutletSettings;

        const mergedSettings = {
            outlet_id: outletId,
            gst_enabled: typedFreshGlobalSettings?.gst_enabled ?? true,
            gst_percentage: typedFreshGlobalSettings?.gst_percentage ?? 18,
            cgst_percentage: typedFreshGlobalSettings?.cgst_percentage ?? 9,
            sgst_percentage: typedFreshGlobalSettings?.sgst_percentage ?? 9,
            ...(typedOutletData || {}),
        };

        return NextResponse.json({ settings: mergedSettings });
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
