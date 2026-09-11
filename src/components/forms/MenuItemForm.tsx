'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MenuItem, PricingMode, QuantityType, Outlet } from '@/lib/types';
import { toast } from 'sonner';
import { Info, Store } from 'lucide-react';
import { useCreateMenuItemMutation, useUpdateMenuItemMutation } from '@/hooks/mutations/useMenuMutations';
import { useCategoriesQuery } from '@/hooks/queries/useMenuQuery';
import { cn } from '@/lib/utils';

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem | null;
  outletId: string;
  onSuccess: () => void;
}

export function MenuItemForm({
  open,
  onOpenChange,
  menuItem,
  outletId,
  onSuccess,
}: MenuItemFormProps) {
  const createMenuItemMutation = useCreateMenuItemMutation();
  const updateMenuItemMutation = useUpdateMenuItemMutation();
  const { data: categoriesData } = useCategoriesQuery(outletId);
  const categories = categoriesData ?? [];
  const [loading, setLoading] = useState(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>([outletId]);
  const [formData, setFormData] = useState({
    outlet_id: outletId,
    name: '',
    description: '',
    price: 0,
    category: '',
    category_id: '',
    available: true,
    image_url: '',
    pricing_mode: PricingMode.FIXED,
    requires_quantity: false,
    available_quantity_types: [QuantityType.FULL] as QuantityType[],
    base_price: 0,
    quarter_price: 0,
    half_price: 0,
    three_quarter_price: 0,
    full_price: 0,
    profit_margin_percent: 0,
  });

  useEffect(() => {
    if (open && outletId) {
      fetchOutlets();
    }
  }, [open, outletId]);

  useEffect(() => {
    if (menuItem) {
      setFormData({
        outlet_id: menuItem.outlet_id,
        name: menuItem.name,
        description: menuItem.description || '',
        price: menuItem.price,
        category: menuItem.category || '',
        category_id: menuItem.category_id || '',
        available: menuItem.available,
        image_url: menuItem.image_url || '',
        pricing_mode: menuItem.pricing_mode || PricingMode.FIXED,
        requires_quantity: menuItem.requires_quantity || false,
        available_quantity_types: menuItem.available_quantity_types || [QuantityType.FULL],
        base_price: menuItem.base_price || 0,
        quarter_price: menuItem.quarter_price || 0,
        half_price: menuItem.half_price || 0,
        three_quarter_price: menuItem.three_quarter_price || 0,
        full_price: menuItem.full_price || 0,
        profit_margin_percent: menuItem.profit_margin_percent || 0,
      });
      // When editing, only the current outlet is selected
      setSelectedOutletIds([menuItem.outlet_id]);
    } else {
      setFormData({
        outlet_id: outletId,
        name: '',
        description: '',
        price: 0,
        category: '',
        category_id: '',
        available: true,
        image_url: '',
        pricing_mode: PricingMode.FIXED,
        requires_quantity: false,
        available_quantity_types: [QuantityType.FULL],
        base_price: 0,
        quarter_price: 0,
        half_price: 0,
        three_quarter_price: 0,
        full_price: 0,
        profit_margin_percent: 0,
      });
      // Pre-select current outlet for new items
      setSelectedOutletIds([outletId]);
    }
  }, [menuItem, outletId, open]);

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/outlets');
      if (response.ok) {
        const data = await response.json();
        setOutlets(data.outlets || data || []);
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const handleOutletToggle = (outletIdToToggle: string) => {
    setSelectedOutletIds(prev => {
      if (prev.includes(outletIdToToggle)) {
        // Don't allow deselecting all outlets
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== outletIdToToggle);
      }
      return [...prev, outletIdToToggle];
    });
  };

  const handleSelectAllOutlets = () => {
    if (selectedOutletIds.length === outlets.length) {
      // Keep at least the current outlet selected
      setSelectedOutletIds([outletId]);
    } else {
      setSelectedOutletIds(outlets.map(o => o.id));
    }
  };

  const handlePricingModeChange = (mode: PricingMode) => {
    setFormData({
      ...formData,
      pricing_mode: mode,
      requires_quantity: mode !== PricingMode.FIXED,
    });
  };

  const loadingMutation = createMenuItemMutation.isPending || updateMenuItemMutation.isPending;
  const loadingState = loading || loadingMutation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rawImageUrl = formData.image_url?.trim();
      const validImageUrl =
        rawImageUrl &&
        (rawImageUrl.startsWith('http://') ||
          rawImageUrl.startsWith('https://') ||
          rawImageUrl.startsWith('/'))
          ? rawImageUrl
          : null;

      // Prepare submit data based on pricing mode
      const submitData: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category: formData.category?.trim() || null,
        category_id: formData.category_id?.trim() || null,
        available: formData.available,
        image_url: validImageUrl,
        pricing_mode: formData.pricing_mode,
        requires_quantity: formData.requires_quantity,
        available_quantity_types: formData.pricing_mode !== PricingMode.FIXED
          ? formData.available_quantity_types
          : null,
        profit_margin_percent: formData.profit_margin_percent || 0,
      };

      // Set price based on pricing mode
      if (formData.pricing_mode === PricingMode.FIXED) {
        submitData.price = formData.price;
        submitData.base_price = null;
        submitData.quarter_price = null;
        submitData.half_price = null;
        submitData.three_quarter_price = null;
        submitData.full_price = null;
      } else if (formData.pricing_mode === PricingMode.QUANTITY_AUTO) {
        submitData.price = formData.base_price;
        submitData.base_price = formData.base_price;
        submitData.quarter_price = null;
        submitData.half_price = null;
        submitData.three_quarter_price = null;
        submitData.full_price = null;
      } else if (formData.pricing_mode === PricingMode.QUANTITY_MANUAL) {
        submitData.price = formData.full_price;
        submitData.base_price = null;
        submitData.quarter_price = formData.available_quantity_types.includes(QuantityType.QUARTER)
          ? formData.quarter_price
          : null;
        submitData.half_price = formData.available_quantity_types.includes(QuantityType.HALF)
          ? formData.half_price
          : null;
        submitData.three_quarter_price = formData.available_quantity_types.includes(QuantityType.THREE_QUARTER)
          ? formData.three_quarter_price
          : null;
        submitData.full_price = formData.available_quantity_types.includes(QuantityType.FULL)
          ? formData.full_price
          : null;
      }

      if (menuItem) {
        await updateMenuItemMutation.mutateAsync({
          id: menuItem.id,
          ...submitData,
        });
      } else {
        submitData.outlet_ids = selectedOutletIds;
        await createMenuItemMutation.mutateAsync(submitData as unknown as Parameters<typeof createMenuItemMutation.mutateAsync>[0]);
        const successCount = selectedOutletIds.length;
        if (successCount > 1) {
          toast.success(`Menu item created in ${successCount} outlets`);
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save menu item';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl border-border/70 shadow-2xl overflow-hidden">
        <DialogHeader className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-border/60 bg-muted/20 flex-shrink-0 text-left">
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
            {menuItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {menuItem ? 'Update menu dish details, pricing structure, and portions.' : 'Add a new dish to your restaurant menu catalog.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-4">
            {/* Multi-Outlet Selection */}
            {!menuItem && outlets.length > 1 && (
              <div className="rounded-xl border border-dashed border-border/70 p-2.5 sm:p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-primary" />
                    <span>Apply to Outlets</span>
                  </Label>
                  <button
                    type="button"
                    onClick={handleSelectAllOutlets}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {selectedOutletIds.length === outlets.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {outlets.map((outlet) => (
                    <label
                      key={outlet.id}
                      className={cn(
                        'flex items-center gap-2 p-1.5 sm:p-2 rounded-lg border text-xs cursor-pointer transition-all',
                        selectedOutletIds.includes(outlet.id)
                          ? 'bg-primary/10 border-primary/40 font-medium text-foreground'
                          : 'bg-background hover:bg-muted/40 border-border/60 text-muted-foreground'
                      )}
                    >
                      <Checkbox
                        checked={selectedOutletIds.includes(outlet.id)}
                        onCheckedChange={() => handleOutletToggle(outlet.id)}
                        className="!h-3.5 !w-3.5 rounded"
                      />
                      <span className="truncate flex-1 text-[11px] sm:text-xs">{outlet.name}</span>
                      {outlet.id === outletId && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-primary/20 text-primary font-bold">
                          Current
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information: 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Special Nihari"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-medium">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => {
                    const selectedCategory = categories.find((c) => c.id === value);
                    setFormData({
                      ...formData,
                      category_id: value,
                      category: selectedCategory?.name || '',
                    });
                  }}
                >
                  <SelectTrigger className="h-8.5 text-xs rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-52 rounded-xl">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-xs">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing Mode */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pricing Mode</Label>
              <Select
                value={formData.pricing_mode}
                onValueChange={(value) => handlePricingModeChange(value as PricingMode)}
              >
                <SelectTrigger className="h-8.5 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={PricingMode.FIXED} className="text-xs">
                    Fixed Price - Single price
                  </SelectItem>
                  <SelectItem value={PricingMode.QUANTITY_AUTO} className="text-xs">
                    Auto Quantity - Calculated portions
                  </SelectItem>
                  <SelectItem value={PricingMode.QUANTITY_MANUAL} className="text-xs">
                    Manual Quantity - Custom portion prices
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fixed Price & Margin */}
            {formData.pricing_mode === PricingMode.FIXED && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-medium">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="h-8.5 text-xs rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profit_margin_percent" className="text-xs font-medium">Profit Margin (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="profit_margin_percent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      value={formData.profit_margin_percent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profit_margin_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8.5 text-xs rounded-xl font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">
                      Est: ₹{((formData.price) * (formData.profit_margin_percent / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description & Image URL (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of dish ingredients, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="text-xs rounded-xl resize-none min-h-[52px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="image_url" className="text-xs font-medium">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  placeholder="https://example.com/dish.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Web link to dish photo (e.g. https://...)</p>
              </div>
            </div>

            {/* Auto Quantity Pricing */}
            {formData.pricing_mode === PricingMode.QUANTITY_AUTO && (
              <div className="space-y-3 p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40">
                <div className="flex items-start gap-2 text-xs text-sky-800 dark:text-sky-300">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Auto Quantity Portions</p>
                    <p className="text-[11px] opacity-80">Full plate base price will automatically scale Q (25%), Half (50%), 3Q (75%).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="base_price" className="text-xs font-medium">Base Price / Full Plate (₹) *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.base_price}
                      onChange={(e) =>
                        setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                      }
                      className="h-8.5 text-xs rounded-xl font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profit_margin_percent" className="text-xs font-medium">Profit Margin (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="profit_margin_percent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        value={formData.profit_margin_percent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            profit_margin_percent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-8.5 text-xs rounded-xl font-mono"
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">
                        Est: ₹{((formData.base_price) * (formData.profit_margin_percent / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-medium text-foreground">
                  <div className="p-1.5 rounded-lg bg-background border text-center">
                    <span className="text-muted-foreground block text-[10px]">Quarter</span>
                    ₹{(formData.base_price * 0.25).toFixed(2)}
                  </div>
                  <div className="p-1.5 rounded-lg bg-background border text-center">
                    <span className="text-muted-foreground block text-[10px]">Half</span>
                    ₹{(formData.base_price * 0.5).toFixed(2)}
                  </div>
                  <div className="p-1.5 rounded-lg bg-background border text-center">
                    <span className="text-muted-foreground block text-[10px]">3/4</span>
                    ₹{(formData.base_price * 0.75).toFixed(2)}
                  </div>
                  <div className="p-1.5 rounded-lg bg-background border text-center">
                    <span className="text-muted-foreground block text-[10px]">Full</span>
                    ₹{formData.base_price.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Quantity Pricing */}
            {formData.pricing_mode === PricingMode.QUANTITY_MANUAL && (
              <div className="space-y-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Manual Quantity Portions</p>
                    <p className="text-[11px] opacity-80">Enable available portions and assign specific menu prices.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[QuantityType.QUARTER, QuantityType.HALF, QuantityType.THREE_QUARTER, QuantityType.FULL].map(
                    (type) => {
                      const isSelected = formData.available_quantity_types.includes(type);
                      const labels: Partial<Record<QuantityType, string>> = {
                        [QuantityType.QUARTER]: 'Quarter (Q)',
                        [QuantityType.HALF]: 'Half (H)',
                        [QuantityType.THREE_QUARTER]: 'Three-Quarters (3Q)',
                        [QuantityType.FULL]: 'Full (F)',
                      };
                      const priceFields: Partial<Record<QuantityType, keyof typeof formData>> = {
                        [QuantityType.QUARTER]: 'quarter_price',
                        [QuantityType.HALF]: 'half_price',
                        [QuantityType.THREE_QUARTER]: 'three_quarter_price',
                        [QuantityType.FULL]: 'full_price',
                      };

                      return (
                        <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/70">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const types = checked
                                ? [...formData.available_quantity_types, type]
                                : formData.available_quantity_types.filter((t) => t !== type);
                              if (types.length > 0) {
                                setFormData({ ...formData, available_quantity_types: types });
                              }
                            }}
                            className="!h-4 !w-4 rounded"
                          />
                          <Label className="text-xs cursor-pointer min-w-[70px]">
                            {labels[type] || type}
                          </Label>
                          {isSelected && priceFields[type] && (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Price ₹"
                              value={formData[priceFields[type]!] as number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  [priceFields[type]!]: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-7.5 text-xs rounded-lg font-mono flex-1"
                            />
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="profit_margin_percent" className="text-xs font-medium">Profit Margin (%)</Label>
                  <Input
                    id="profit_margin_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    value={formData.profit_margin_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profit_margin_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-8.5 text-xs rounded-xl font-mono sm:max-w-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Pinned Footer: Availability & Actions always in view */}
          <DialogFooter className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-border/60 bg-muted/20 flex-shrink-0 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available: checked as boolean })
                }
                className="!h-4 !w-4 rounded-md"
              />
              <Label htmlFor="available" className="text-xs font-semibold cursor-pointer select-none text-foreground">
                Available in Stock
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loadingState}
                className="h-8.5 px-3 text-xs font-semibold rounded-xl border-border/70"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loadingState}
                className="h-8.5 px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                {loadingState
                  ? 'Saving...'
                  : menuItem
                    ? 'Update Item'
                    : `Create Item${!menuItem && selectedOutletIds.length > 1 ? ` (${selectedOutletIds.length})` : ''}`}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
