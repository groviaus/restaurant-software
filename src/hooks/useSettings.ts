'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOutlet } from './useOutlet';

export interface OutletSettings {
    outlet_id: string;
    // Tax
    gst_enabled: boolean;
    gst_percentage: number;
    cgst_percentage: number;
    sgst_percentage: number;
    // Business Info
    business_name: string | null;
    gstin: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
    email: string | null;
    // Receipt
    receipt_header: string | null;
    receipt_footer: string | null;
    show_gstin_on_bill: boolean;
    show_address_on_bill: boolean;
    // Order
    default_order_type: 'DINE_IN' | 'TAKEAWAY';
    auto_print_bill: boolean;
    allow_takeaway: boolean;
    allow_dine_in: boolean;
    // Currency
    currency_symbol: string;
    currency_code: string;
}

const defaultSettings: OutletSettings = {
    outlet_id: '',
    gst_enabled: true,
    gst_percentage: 18,
    cgst_percentage: 9,
    sgst_percentage: 9,
    business_name: null,
    gstin: null,
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    pincode: null,
    phone: null,
    email: null,
    receipt_header: null,
    receipt_footer: null,
    show_gstin_on_bill: true,
    show_address_on_bill: true,
    default_order_type: 'DINE_IN',
    auto_print_bill: false,
    allow_takeaway: true,
    allow_dine_in: true,
    currency_symbol: '₹',
    currency_code: 'INR',
};

// Cache settings per outlet
const settingsCache: Record<string, { settings: OutletSettings; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSettings() {
    const { currentOutlet } = useOutlet();
    const [settings, setSettings] = useState<OutletSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        if (!currentOutlet?.id) {
            setSettings(defaultSettings);
            setLoading(false);
            return;
        }

        // Check cache first
        const cached = settingsCache[currentOutlet.id];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setSettings(cached.settings);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                const fetchedSettings = { ...defaultSettings, ...data.settings };
                setSettings(fetchedSettings);

                // Cache the settings
                settingsCache[currentOutlet.id] = {
                    settings: fetchedSettings,
                    timestamp: Date.now(),
                };
            } else {
                setSettings(defaultSettings);
            }
        } catch (err: any) {
            console.error('Error fetching settings:', err);
            setError(err.message);
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    }, [currentOutlet?.id]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Helper function to calculate tax
    const calculateTax = useCallback((subtotal: number) => {
        if (!settings.gst_enabled) {
            return { cgst: 0, sgst: 0, total: 0 };
        }
        const cgst = subtotal * (settings.cgst_percentage / 100);
        const sgst = subtotal * (settings.sgst_percentage / 100);
        return {
            cgst,
            sgst,
            total: cgst + sgst,
        };
    }, [settings.gst_enabled, settings.cgst_percentage, settings.sgst_percentage]);

    // Helper to get full address
    const getFullAddress = useCallback(() => {
        const parts = [
            settings.address_line1,
            settings.address_line2,
            settings.city,
            settings.state,
            settings.pincode,
        ].filter(Boolean);
        return parts.join(', ');
    }, [settings]);

    // Invalidate cache (call after saving settings)
    const invalidateCache = useCallback(() => {
        if (currentOutlet?.id) {
            delete settingsCache[currentOutlet.id];
        }
        fetchSettings();
    }, [currentOutlet?.id, fetchSettings]);

    return {
        settings,
        loading,
        error,
        calculateTax,
        getFullAddress,
        invalidateCache,
        refetch: fetchSettings,
    };
}
