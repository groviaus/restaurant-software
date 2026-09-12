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
  AlertCircle,
  Percent,
  Coins,
  MapPin,
  Phone,
  Mail,
  Printer,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOutlet } from '@/hooks/useOutlet';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

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

// In-memory cache across navigations
const settingsMemoryCache: Record<string, OutletSettings> = {};

export default function SettingsPage() {
  const router = useRouter();
  const { currentOutlet } = useOutlet();
  const { checkPermission, loading: permLoading } = usePermissions();
  const cachedSettings = currentOutlet?.id ? settingsMemoryCache[currentOutlet.id] : undefined;

  const [settings, setSettings] = useState<OutletSettings>(() => cachedSettings || defaultSettings);
  const [loading, setLoading] = useState(() => !cachedSettings);
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
    if (!currentOutlet?.id || !settingsMemoryCache[currentOutlet.id]) {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const merged = { ...defaultSettings, ...data.settings };
        setSettings(merged);
        if (currentOutlet?.id) {
          settingsMemoryCache[currentOutlet.id] = merged;
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof OutletSettings>(key: K, value: OutletSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateGstPercentage = (value: number) => {
    const half = value / 2;
    setSettings((prev) => ({
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

      toast.success('Outlet preferences saved successfully');
      setHasChanges(false);
      if (currentOutlet?.id) {
        settingsMemoryCache[currentOutlet.id] = settings;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (permLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading outlet settings...</p>
      </div>
    );
  }

  if (!currentOutlet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] p-6 text-center space-y-3 bg-card rounded-2xl border border-border/70">
        <Building2 className="w-10 h-10 text-muted-foreground/60" />
        <h2 className="text-base font-bold text-foreground">No Outlet Selected</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Select an active branch location from the top navigation bar to configure taxes, business details, and printing rules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Outlet Preferences
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {currentOutlet.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure taxation compliance, thermal receipt layouts, business profiles, and POS behaviors
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            className={cn(
              'h-9 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer transition-all',
              hasChanges ? 'ring-2 ring-primary/30' : ''
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved banner */}
      {hasChanges && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-2 text-amber-700 dark:text-amber-400 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">You have unsaved changes in your outlet preferences.</span>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Modern Tabs */}
      <Tabs defaultValue="tax" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:max-w-2xl h-11 p-1 bg-muted/60 rounded-2xl border border-border/60">
          <TabsTrigger value="tax" className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:shadow-xs">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Tax & GST</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:shadow-xs">
            <Building2 className="h-3.5 w-3.5" />
            <span>Business</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:shadow-xs">
            <Receipt className="h-3.5 w-3.5" />
            <span>Receipt & Bill</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:shadow-xs">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Orders & Print</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Tax & GST Settings */}
        <TabsContent value="tax" className="space-y-4">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Goods & Services Tax (GST) Compliance
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Calculate and print statutory GST breakdowns on order bills and thermal receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* GST Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card/60">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Apply GST on Bills</Label>
                  <p className="text-[11px] text-muted-foreground">
                    When enabled, orders automatically calculate CGST and SGST on taxable items
                  </p>
                </div>
                <Switch
                  checked={settings.gst_enabled}
                  onCheckedChange={(checked) => updateSetting('gst_enabled', checked)}
                />
              </div>

              {settings.gst_enabled && (
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="gst_percentage" className="text-xs font-semibold text-foreground/90">
                        Total GST Rate (%)
                      </Label>
                      <Input
                        id="gst_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.gst_percentage}
                        onChange={(e) => updateGstPercentage(parseFloat(e.target.value) || 0)}
                        className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cgst_percentage" className="text-xs font-semibold text-foreground/90">
                        CGST Rate (%)
                      </Label>
                      <Input
                        id="cgst_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.cgst_percentage}
                        onChange={(e) => updateSetting('cgst_percentage', parseFloat(e.target.value) || 0)}
                        className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sgst_percentage" className="text-xs font-semibold text-foreground/90">
                        SGST Rate (%)
                      </Label>
                      <Input
                        id="sgst_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.sgst_percentage}
                        onChange={(e) => updateSetting('sgst_percentage', parseFloat(e.target.value) || 0)}
                        className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Adjusting Total GST automatically recalculates a 50/50 CGST & SGST split.
                  </p>
                </div>
              )}

              {/* Currency Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currency_symbol" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-muted-foreground" />
                    Currency Display Symbol
                  </Label>
                  <Input
                    id="currency_symbol"
                    value={settings.currency_symbol}
                    onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                    placeholder="₹"
                    className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currency_code" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-muted-foreground" />
                    ISO Currency Code
                  </Label>
                  <Input
                    id="currency_code"
                    value={settings.currency_code}
                    onChange={(e) => updateSetting('currency_code', e.target.value.toUpperCase())}
                    placeholder="INR"
                    maxLength={3}
                    className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono uppercase"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Business Information */}
        <TabsContent value="business" className="space-y-4">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Legal & Business Profile
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Official entity name, GSTIN identification, and tax invoice contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="business_name" className="text-xs font-semibold text-foreground/90">
                    Trade / Legal Entity Name
                  </Label>
                  <Input
                    id="business_name"
                    value={settings.business_name || ''}
                    onChange={(e) => updateSetting('business_name', e.target.value || null)}
                    placeholder="e.g. Gourmet Bites Hospitality LLP"
                    className="h-10 rounded-xl border-border/70 bg-background text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gstin" className="text-xs font-semibold text-foreground/90">
                    GSTIN / Tax Identification
                  </Label>
                  <Input
                    id="gstin"
                    value={settings.gstin || ''}
                    onChange={(e) => updateSetting('gstin', e.target.value.toUpperCase() || null)}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Customer Support Phone
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => updateSetting('phone', e.target.value || null)}
                    placeholder="+91 98765 43210"
                    className="h-10 rounded-xl border-border/70 bg-background text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Official Billing Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => updateSetting('email', e.target.value || null)}
                    placeholder="billing@gourmetbites.in"
                    className="h-10 rounded-xl border-border/70 bg-background text-sm"
                  />
                </div>
              </div>

              {/* Physical Address Section */}
              <div className="pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Physical Store Address
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address_line1" className="text-xs font-semibold text-foreground/90">
                      Street Address
                    </Label>
                    <Input
                      id="address_line1"
                      value={settings.address_line1 || ''}
                      onChange={(e) => updateSetting('address_line1', e.target.value || null)}
                      placeholder="Shop 14, Ground Floor, Central Plaza"
                      className="h-10 rounded-xl border-border/70 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address_line2" className="text-xs font-semibold text-foreground/90">
                      Area / Landmark
                    </Label>
                    <Input
                      id="address_line2"
                      value={settings.address_line2 || ''}
                      onChange={(e) => updateSetting('address_line2', e.target.value || null)}
                      placeholder="Near Metro Station Gate 2"
                      className="h-10 rounded-xl border-border/70 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold text-foreground/90">City</Label>
                    <Input
                      id="city"
                      value={settings.city || ''}
                      onChange={(e) => updateSetting('city', e.target.value || null)}
                      placeholder="Mumbai"
                      className="h-10 rounded-xl border-border/70 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-xs font-semibold text-foreground/90">State</Label>
                    <Input
                      id="state"
                      value={settings.state || ''}
                      onChange={(e) => updateSetting('state', e.target.value || null)}
                      placeholder="Maharashtra"
                      className="h-10 rounded-xl border-border/70 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode" className="text-xs font-semibold text-foreground/90">PIN / Postal Code</Label>
                    <Input
                      id="pincode"
                      value={settings.pincode || ''}
                      onChange={(e) => updateSetting('pincode', e.target.value || null)}
                      placeholder="400001"
                      maxLength={10}
                      className="h-10 rounded-xl border-border/70 bg-background text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Receipt & Branding */}
        <TabsContent value="receipt" className="space-y-4">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Thermal Receipt & Invoice Customization
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Customize headers, greetings, footers, and visibility flags on 80mm/58mm thermal bills
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="receipt_header" className="text-xs font-semibold text-foreground/90">
                    Receipt Top Header Text
                  </Label>
                  <Textarea
                    id="receipt_header"
                    value={settings.receipt_header || ''}
                    onChange={(e) => updateSetting('receipt_header', e.target.value || null)}
                    placeholder="e.g. Welcome to Gourmet Bites • Pure Vegetarian & Freshly Prepared"
                    rows={2}
                    className="rounded-xl border-border/70 bg-background text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="receipt_footer" className="text-xs font-semibold text-foreground/90">
                    Receipt Footer Note / Greeting
                  </Label>
                  <Textarea
                    id="receipt_footer"
                    value={settings.receipt_footer || ''}
                    onChange={(e) => updateSetting('receipt_footer', e.target.value || null)}
                    placeholder="e.g. Thank you for dining with us! For feedback call 9876543210 • Have a great day!"
                    rows={2}
                    className="rounded-xl border-border/70 bg-background text-xs resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">Show GSTIN on Bill</Label>
                    <p className="text-[11px] text-muted-foreground">Print official tax identifier on paper receipt</p>
                  </div>
                  <Switch
                    checked={settings.show_gstin_on_bill}
                    onCheckedChange={(checked) => updateSetting('show_gstin_on_bill', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">Show Store Address</Label>
                    <p className="text-[11px] text-muted-foreground">Print full address and contact line on paper</p>
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

        {/* 4. Orders & Printing */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                POS Workflow & Auto-Printing Rules
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Set active order channels and automated bill printing upon order settlement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="default_order_type" className="text-xs font-semibold text-foreground/90">
                  Default Order Type in POS
                </Label>
                <Select
                  value={settings.default_order_type}
                  onValueChange={(value) => updateSetting('default_order_type', value as 'DINE_IN' | 'TAKEAWAY')}
                >
                  <SelectTrigger className="w-full sm:w-[260px] h-10 rounded-xl border-border/70 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="DINE_IN">Dine In (Table Seating)</SelectItem>
                    <SelectItem value="TAKEAWAY">Takeaway (Counter / Parcel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">Allow Dine-In Orders</Label>
                    <p className="text-[11px] text-muted-foreground">Enable floor plan, table assignment, and waiter ordering</p>
                  </div>
                  <Switch
                    checked={settings.allow_dine_in}
                    onCheckedChange={(checked) => updateSetting('allow_dine_in', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">Allow Takeaway / Parcel Orders</Label>
                    <p className="text-[11px] text-muted-foreground">Enable quick counter orders without table selection</p>
                  </div>
                  <Switch
                    checked={settings.allow_takeaway}
                    onCheckedChange={(checked) => updateSetting('allow_takeaway', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">Auto-Print Thermal Bill on Settlement</Label>
                    <p className="text-[11px] text-muted-foreground">Automatically send print job to connected thermal printer</p>
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
    </div>
  );
}
