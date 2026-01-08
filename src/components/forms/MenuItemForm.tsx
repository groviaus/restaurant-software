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
import { MenuItem, PricingMode, Category, QuantityType } from '@/lib/types';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

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
  });

  useEffect(() => {
    if (open && outletId) {
      fetchCategories();
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
      });
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
      });
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
      const url = menuItem ? `/api/menu/${menuItem.id}` : '/api/menu';
      const method = menuItem ? 'PATCH' : 'POST';

      // Prepare submit data based on pricing mode
      const submitData: any = {
        outlet_id: formData.outlet_id,
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
        submitData.price = formData.base_price; // Store base price in price field
        submitData.base_price = formData.base_price;
        submitData.quarter_price = null;
        submitData.half_price = null;
        submitData.three_quarter_price = null;
        submitData.full_price = null;
      } else if (formData.pricing_mode === PricingMode.QUANTITY_MANUAL) {
        submitData.price = formData.full_price; // Store full price as default
        submitData.base_price = null;

        // Only include prices for selected quantity types
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

      console.log('Submitting menu item:', submitData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error Response:', error);
        throw new Error(error.error || 'Failed to save menu item');
      }

      toast.success(menuItem ? 'Menu item updated' : 'Menu item created');
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
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing Mode Selection */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pricing_mode">Pricing Mode *</Label>
              <Select
                value={formData.pricing_mode}
                onValueChange={(value) => handlePricingModeChange(value as PricingMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PricingMode.FIXED}>
                    Fixed Price (No Quantity)
                  </SelectItem>
                  <SelectItem value={PricingMode.QUANTITY_AUTO}>
                    Quantity-Based (Auto Calculate)
                  </SelectItem>
                  <SelectItem value={PricingMode.QUANTITY_MANUAL}>
                    Quantity-Based (Manual Prices)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  {formData.pricing_mode === PricingMode.FIXED &&
                    'Single fixed price for this item'}
                  {formData.pricing_mode === PricingMode.QUANTITY_AUTO &&
                    'Prices calculated automatically (Quarter=25%, Half=50%, etc.)'}
                  {formData.pricing_mode === PricingMode.QUANTITY_MANUAL &&
                    'Set individual prices for each quantity option'}
                </span>
              </p>
            </div>

            {/* Quantity Type Selection - Only show for quantity-based pricing */}
            {(formData.pricing_mode === PricingMode.QUANTITY_AUTO ||
              formData.pricing_mode === PricingMode.QUANTITY_MANUAL) && (
                <div className="grid gap-3 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-medium">Available Quantity Options *</Label>
                  <p className="text-xs text-gray-500 -mt-2">
                    Select which quantity options customers can choose from
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Quarter (¼)', value: QuantityType.QUARTER },
                      { label: 'Half (½)', value: QuantityType.HALF },
                      { label: 'Three Quarter (¾)', value: QuantityType.THREE_QUARTER },
                      { label: 'Full', value: QuantityType.FULL },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`qty-${option.value}`}
                          checked={formData.available_quantity_types.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                available_quantity_types: [...formData.available_quantity_types, option.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                available_quantity_types: formData.available_quantity_types.filter(
                                  (t) => t !== option.value
                                ),
                              });
                            }
                          }}
                        />
                        <Label
                          htmlFor={`qty-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.available_quantity_types.length === 0 && (
                    <p className="text-xs text-red-600">
                      Please select at least one quantity option
                    </p>
                  )}
                </div>
              )}

            {/* Fixed Price Mode */}
            {formData.pricing_mode === PricingMode.FIXED && (
              <div className="grid gap-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setFormData({ ...formData, price: parseFloat(value) || 0 });
                  }}
                  required
                />
              </div>
            )}

            {/* Automatic Quantity Pricing */}
            {formData.pricing_mode === PricingMode.QUANTITY_AUTO && (
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="base_price">Base Price (Full) *</Label>
                  <Input
                    id="base_price"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    placeholder="0.00"
                    value={formData.base_price || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setFormData({ ...formData, base_price: parseFloat(value) || 0 });
                    }}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Prices will be calculated: Quarter = ₹{(formData.base_price * 0.25).toFixed(2)},
                    Half = ₹{(formData.base_price * 0.5).toFixed(2)},
                    3/4 = ₹{(formData.base_price * 0.75).toFixed(2)},
                    Full = ₹{formData.base_price.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Manual Quantity Pricing */}
            {formData.pricing_mode === PricingMode.QUANTITY_MANUAL && (
              <div className="space-y-3">
                <div className={`grid gap-3 ${formData.available_quantity_types.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {formData.available_quantity_types.includes(QuantityType.QUARTER) && (
                    <div className="grid gap-2">
                      <Label htmlFor="quarter_price">Quarter *</Label>
                      <Input
                        id="quarter_price"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder="0.00"
                        value={formData.quarter_price || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setFormData({
                            ...formData,
                            quarter_price: parseFloat(value) || 0,
                          });
                        }}
                        required
                      />
                    </div>
                  )}

                  {formData.available_quantity_types.includes(QuantityType.HALF) && (
                    <div className="grid gap-2">
                      <Label htmlFor="half_price">Half *</Label>
                      <Input
                        id="half_price"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder="0.00"
                        value={formData.half_price || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setFormData({ ...formData, half_price: parseFloat(value) || 0 });
                        }}
                        required
                      />
                    </div>
                  )}

                  {formData.available_quantity_types.includes(QuantityType.THREE_QUARTER) && (
                    <div className="grid gap-2">
                      <Label htmlFor="three_quarter_price">Three Quarter *</Label>
                      <Input
                        id="three_quarter_price"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder="0.00"
                        value={formData.three_quarter_price || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setFormData({
                            ...formData,
                            three_quarter_price: parseFloat(value) || 0,
                          });
                        }}
                        required
                      />
                    </div>
                  )}

                  {formData.available_quantity_types.includes(QuantityType.FULL) && (
                    <div className="grid gap-2">
                      <Label htmlFor="full_price">Full *</Label>
                      <Input
                        id="full_price"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder="0.00"
                        value={formData.full_price || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setFormData({ ...formData, full_price: parseFloat(value) || 0 });
                        }}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
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
              {loading ? 'Saving...' : menuItem ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
