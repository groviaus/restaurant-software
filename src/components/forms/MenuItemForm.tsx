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
import { MenuItem, PricingMode, Category, QuantityType, Outlet } from '@/lib/types';
import { toast } from 'sonner';
import { Info, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
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
      fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?outlet_id=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare submit data based on pricing mode
      const submitData: any = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        category_id: formData.category_id || null,
        available: formData.available,
        image_url: formData.image_url?.trim() || null,
        pricing_mode: formData.pricing_mode,
        requires_quantity: formData.requires_quantity,
        available_quantity_types: formData.pricing_mode !== PricingMode.FIXED
          ? formData.available_quantity_types
          : null,
        profit_margin_percent: formData.profit_margin_percent,
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
        // Editing existing item - update single outlet
        const response = await fetch(`/api/menu/${menuItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...submitData, outlet_id: formData.outlet_id }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update menu item');
        }
        toast.success('Menu item updated');
      } else {
        // Creating new item(s) - support multiple outlets
        submitData.outlet_ids = selectedOutletIds;

        const response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create menu item');
        }

        const successCount = selectedOutletIds.length;
        toast.success(
          successCount > 1
            ? `Menu item created in ${successCount} outlets`
            : 'Menu item created'
        );
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menuItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {menuItem ? 'Update the menu item details' : 'Add a new item to the menu'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Multi-Outlet Selection - Only show for new items and if there are multiple outlets */}
          {!menuItem && outlets.length > 1 && (
            <Card className="border-dashed">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Create in Outlets
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllOutlets}
                    className="h-7 text-xs"
                  >
                    {selectedOutletIds.length === outlets.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {outlets.map((outlet) => (
                    <label
                      key={outlet.id}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${selectedOutletIds.includes(outlet.id)
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-muted/50'
                        }`}
                    >
                      <Checkbox
                        checked={selectedOutletIds.includes(outlet.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOutletIds(prev => [...prev, outlet.id]);
                          } else {
                            // Don't allow deselecting all outlets
                            if (selectedOutletIds.length > 1) {
                              setSelectedOutletIds(prev => prev.filter(id => id !== outlet.id));
                            }
                          }
                        }}
                      />
                      <span className="text-sm truncate flex-1">{outlet.name}</span>
                      {outlet.id === outletId && (
                        <span className="text-xs text-primary font-medium">Current</span>
                      )}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Special Nihari"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the item"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing Mode Selection */}
          <div className="grid gap-2">
            <Label>Pricing Mode</Label>
            <Select
              value={formData.pricing_mode}
              onValueChange={(value) => handlePricingModeChange(value as PricingMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PricingMode.FIXED}>
                  Fixed Price - Single price for all orders
                </SelectItem>
                <SelectItem value={PricingMode.QUANTITY_AUTO}>
                  Auto Quantity - Calculate price based on weight/quantity
                </SelectItem>
                <SelectItem value={PricingMode.QUANTITY_MANUAL}>
                  Manual Quantity - Set different prices per portion
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fixed Price Input */}
          {formData.pricing_mode === PricingMode.FIXED && (
            <div className="grid gap-2">
              <Label htmlFor="price">Price (₹) *</Label>
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
                required
              />
            </div>
          )}

          {/* Auto Quantity Pricing */}
          {formData.pricing_mode === PricingMode.QUANTITY_AUTO && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-xs sm:text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Auto Quantity Pricing</p>
                    <p>Set a base price per full plate. Portions will be calculated automatically.</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="base_price">Base Price per Full Plate (₹) *</Label>
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
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600">
                <div>Quarter: ₹{(formData.base_price * 0.25).toFixed(2)}</div>
                <div>Half: ₹{(formData.base_price * 0.5).toFixed(2)}</div>
                <div>3/4: ₹{(formData.base_price * 0.75).toFixed(2)}</div>
                <div>Full: ₹{formData.base_price.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Manual Quantity Pricing */}
          {formData.pricing_mode === PricingMode.QUANTITY_MANUAL && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg text-xs sm:text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Manual Quantity Pricing</p>
                    <p>Select available portions and set custom prices for each.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[QuantityType.QUARTER, QuantityType.HALF, QuantityType.THREE_QUARTER, QuantityType.FULL].map(
                  (type) => {
                    const isSelected = formData.available_quantity_types.includes(type);
                    const labels: Partial<Record<QuantityType, string>> = {
                      [QuantityType.QUARTER]: 'Quarter',
                      [QuantityType.HALF]: 'Half',
                      [QuantityType.THREE_QUARTER]: '3/4',
                      [QuantityType.FULL]: 'Full',
                    };
                    const priceFields: Partial<Record<QuantityType, keyof typeof formData>> = {
                      [QuantityType.QUARTER]: 'quarter_price',
                      [QuantityType.HALF]: 'half_price',
                      [QuantityType.THREE_QUARTER]: 'three_quarter_price',
                      [QuantityType.FULL]: 'full_price',
                    };

                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center gap-2">
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
                          />
                          <Label className="cursor-pointer">{labels[type] || type}</Label>
                        </div>
                        {isSelected && priceFields[type] && (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            value={formData[priceFields[type]!] as number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [priceFields[type]!]: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Profit Margin */}
          <div className="grid gap-2">
            <Label htmlFor="profit_margin_percent">Profit Margin (%)</Label>
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
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Est. Profit: ₹
                {(
                  (formData.pricing_mode === PricingMode.FIXED
                    ? formData.price
                    : formData.pricing_mode === PricingMode.QUANTITY_AUTO
                      ? formData.base_price
                      : formData.full_price || formData.price) *
                  (formData.profit_margin_percent / 100)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, available: checked as boolean })
              }
            />
            <Label htmlFor="available" className="cursor-pointer select-none">
              Item available for ordering
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : menuItem ? 'Update Item' : `Create Item${!menuItem && selectedOutletIds.length > 1 ? ` (${selectedOutletIds.length})` : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
