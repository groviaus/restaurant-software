'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Receipt,
    Building2,
    IndianRupee,
    ShoppingBag,
    Loader2,
    Save,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useOutlet } from '@/hooks/useOutlet';
import { usePermissions } from '@/hooks/usePermissions';

interface OutletSettings {
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

export default function SettingsPage() {
    const router = useRouter();
    const { currentOutlet } = useOutlet();
    const { checkPermission, loading: permLoading } = usePermissions();
    const [settings, setSettings] = useState<OutletSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (!permLoading && !checkPermission('settings', 'view')) {
            router.push('/dashboard');
        }
    }, [permLoading, checkPermission, router]);

    useEffect(() => {
        if (currentOutlet) {
            fetchSettings();
        }
    }, [currentOutlet?.id]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings({ ...defaultSettings, ...data.settings });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = <K extends keyof OutletSettings>(key: K, value: OutletSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    // Auto-update CGST and SGST when GST changes (split equally)
    const updateGstPercentage = (value: number) => {
        const half = value / 2;
        setSettings(prev => ({
            ...prev,
            gst_percentage: value,
            cgst_percentage: half,
            sgst_percentage: half,
        }));
        setHasChanges(true);
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save settings');
            }

            toast.success('Settings saved successfully');
            setHasChanges(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (permLoading || loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!currentOutlet) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Please select an outlet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="h-7 w-7" />
                        Settings
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Configure your outlet settings
                    </p>
                </div>
                <Button
                    onClick={saveSettings}
                    disabled={saving || !hasChanges}
                    className="w-full sm:w-auto"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {hasChanges && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>You have unsaved changes</span>
                </div>
            )}

            <Tabs defaultValue="tax" className="space-y-4">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto gap-1 p-1">
                    <TabsTrigger value="tax" className="text-xs sm:text-sm py-2">
                        <IndianRupee className="h-4 w-4 mr-1 hidden sm:inline" />
                        Tax & GST
                    </TabsTrigger>
                    <TabsTrigger value="business" className="text-xs sm:text-sm py-2">
                        <Building2 className="h-4 w-4 mr-1 hidden sm:inline" />
                        Business
                    </TabsTrigger>
                    <TabsTrigger value="receipt" className="text-xs sm:text-sm py-2">
                        <Receipt className="h-4 w-4 mr-1 hidden sm:inline" />
                        Receipt
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="text-xs sm:text-sm py-2">
                        <ShoppingBag className="h-4 w-4 mr-1 hidden sm:inline" />
                        Orders
                    </TabsTrigger>
                </TabsList>

                {/* Tax & GST Settings */}
                <TabsContent value="tax">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IndianRupee className="h-5 w-5" />
                                Tax & GST Settings
                            </CardTitle>
                            <CardDescription>
                                Configure GST and tax settings for your bills
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* GST Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">Enable GST</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Add GST to all orders and bills
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.gst_enabled}
                                    onCheckedChange={(checked) => updateSetting('gst_enabled', checked)}
                                />
                            </div>

                            {settings.gst_enabled && (
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="gst_percentage">Total GST (%)</Label>
                                            <Input
                                                id="gst_percentage"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={settings.gst_percentage}
                                                onChange={(e) => updateGstPercentage(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cgst_percentage">CGST (%)</Label>
                                            <Input
                                                id="cgst_percentage"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={settings.cgst_percentage}
                                                onChange={(e) => updateSetting('cgst_percentage', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sgst_percentage">SGST (%)</Label>
                                            <Input
                                                id="sgst_percentage"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={settings.sgst_percentage}
                                                onChange={(e) => updateSetting('sgst_percentage', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Tip: Set Total GST and CGST/SGST will auto-split equally
                                    </p>
                                </div>
                            )}

                            {/* Currency Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency_symbol">Currency Symbol</Label>
                                    <Input
                                        id="currency_symbol"
                                        value={settings.currency_symbol}
                                        onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                                        placeholder="₹"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency_code">Currency Code</Label>
                                    <Input
                                        id="currency_code"
                                        value={settings.currency_code}
                                        onChange={(e) => updateSetting('currency_code', e.target.value.toUpperCase())}
                                        placeholder="INR"
                                        maxLength={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Business Info */}
                <TabsContent value="business">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Business Information
                            </CardTitle>
                            <CardDescription>
                                This information appears on your bills and receipts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="business_name">Business Name</Label>
                                    <Input
                                        id="business_name"
                                        value={settings.business_name || ''}
                                        onChange={(e) => updateSetting('business_name', e.target.value || null)}
                                        placeholder="Your Restaurant Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gstin">GSTIN</Label>
                                    <Input
                                        id="gstin"
                                        value={settings.gstin || ''}
                                        onChange={(e) => updateSetting('gstin', e.target.value.toUpperCase() || null)}
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength={15}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={settings.phone || ''}
                                        onChange={(e) => updateSetting('phone', e.target.value || null)}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={settings.email || ''}
                                        onChange={(e) => updateSetting('email', e.target.value || null)}
                                        placeholder="contact@restaurant.com"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-4">
                                <Label className="text-base font-medium">Address</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="address_line1">Address Line 1</Label>
                                        <Input
                                            id="address_line1"
                                            value={settings.address_line1 || ''}
                                            onChange={(e) => updateSetting('address_line1', e.target.value || null)}
                                            placeholder="Street address"
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="address_line2">Address Line 2</Label>
                                        <Input
                                            id="address_line2"
                                            value={settings.address_line2 || ''}
                                            onChange={(e) => updateSetting('address_line2', e.target.value || null)}
                                            placeholder="Building, Floor, etc."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={settings.city || ''}
                                            onChange={(e) => updateSetting('city', e.target.value || null)}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={settings.state || ''}
                                            onChange={(e) => updateSetting('state', e.target.value || null)}
                                            placeholder="State"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pincode">Pincode</Label>
                                        <Input
                                            id="pincode"
                                            value={settings.pincode || ''}
                                            onChange={(e) => updateSetting('pincode', e.target.value || null)}
                                            placeholder="400001"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Receipt Settings */}
                <TabsContent value="receipt">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Receipt & Bill Settings
                            </CardTitle>
                            <CardDescription>
                                Customize how your bills and receipts appear
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="receipt_header">Receipt Header</Label>
                                    <Textarea
                                        id="receipt_header"
                                        value={settings.receipt_header || ''}
                                        onChange={(e) => updateSetting('receipt_header', e.target.value || null)}
                                        placeholder="Text to appear at the top of receipts"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="receipt_footer">Receipt Footer</Label>
                                    <Textarea
                                        id="receipt_footer"
                                        value={settings.receipt_footer || ''}
                                        onChange={(e) => updateSetting('receipt_footer', e.target.value || null)}
                                        placeholder="e.g., Thank you for visiting! Please come again."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Show GSTIN on Bill</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Display your GSTIN number on printed bills
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.show_gstin_on_bill}
                                        onCheckedChange={(checked) => updateSetting('show_gstin_on_bill', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Show Address on Bill</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Display your business address on printed bills
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.show_address_on_bill}
                                        onCheckedChange={(checked) => updateSetting('show_address_on_bill', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Order Settings */}
                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Order Settings
                            </CardTitle>
                            <CardDescription>
                                Configure default order behavior
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="default_order_type">Default Order Type</Label>
                                <Select
                                    value={settings.default_order_type}
                                    onValueChange={(value) => updateSetting('default_order_type', value as 'DINE_IN' | 'TAKEAWAY')}
                                >
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DINE_IN">Dine In</SelectItem>
                                        <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Allow Dine-In Orders</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Enable dine-in order type
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.allow_dine_in}
                                        onCheckedChange={(checked) => updateSetting('allow_dine_in', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Allow Takeaway Orders</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Enable takeaway order type
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.allow_takeaway}
                                        onCheckedChange={(checked) => updateSetting('allow_takeaway', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Auto-Print Bill</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically print bill when order is completed
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.auto_print_bill}
                                        onCheckedChange={(checked) => updateSetting('auto_print_bill', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button (Mobile Fixed) */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <Button
                    onClick={saveSettings}
                    disabled={saving || !hasChanges}
                    className="w-full"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Spacer for mobile fixed button */}
            <div className="h-20 sm:hidden" />
        </div>
    );
}
