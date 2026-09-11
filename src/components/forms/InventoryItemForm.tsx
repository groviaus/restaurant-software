'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { InventoryItem, InventoryItemType } from '@/lib/types';
import { ALL_UNITS } from '@/lib/inventory/unitConversions';
import { toast } from 'sonner';
import { Package2, X, Loader2, ChevronDown, Layers, Scale, Gauge, IndianRupee, Tag, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEM_TYPE_LABELS: Record<InventoryItemType, string> = {
  raw_material: 'Raw Material',
  ingredient: 'Ingredient',
  prepared_item: 'Prepared Item',
  packaging: 'Packaging',
  other: 'Other',
};

const ITEM_TYPE_COLORS: Record<InventoryItemType, string> = {
  raw_material: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  ingredient: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  prepared_item: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  packaging: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20',
  other: 'bg-muted text-muted-foreground border border-border/60',
};

interface InventoryItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  outletId: string;
  onSuccess: (item: InventoryItem) => void;
}

const defaultForm = {
  name: '',
  sku: '',
  category: '',
  item_type: InventoryItemType.INGREDIENT as InventoryItemType,
  stock_unit: 'g',
  purchase_unit: '',
  unit_conversion_factor: 1,
  min_stock: 0,
  reorder_level: 0,
  par_level: 0,
  cost_per_unit: 0,
  active: true,
  supplier_name: '',
  storage_location: '',
  notes: '',
};

export function InventoryItemForm({ open, onOpenChange, item, outletId, onSuccess }: InventoryItemFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          name: item.name,
          sku: item.sku ?? '',
          category: item.category ?? '',
          item_type: item.item_type,
          stock_unit: item.stock_unit,
          purchase_unit: item.purchase_unit ?? '',
          unit_conversion_factor: item.unit_conversion_factor ?? 1,
          min_stock: item.min_stock ?? 0,
          reorder_level: item.reorder_level ?? 0,
          par_level: item.par_level ?? 0,
          cost_per_unit: item.cost_per_unit ?? 0,
          active: item.active ?? true,
          supplier_name: item.supplier_name ?? '',
          storage_location: item.storage_location ?? '',
          notes: item.notes ?? '',
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [open, item]);

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        sku: form.sku || null,
        category: form.category || null,
        purchase_unit: form.purchase_unit || null,
        supplier_name: form.supplier_name || null,
        storage_location: form.storage_location || null,
        notes: form.notes || null,
        ...(item ? { id: item.id } : {}),
      };

      const res = await fetch('/api/inventory/items', {
        method: item ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save item');

      toast.success(item ? 'Item updated successfully' : 'Item created successfully');
      onSuccess(data.item);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border/80 shadow-2xl bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <Package2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {item ? 'Edit Inventory Item' : 'New Inventory Item'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {item ? 'Update item details, units, and safety stock thresholds' : 'Add a raw material or ingredient for recipe BOM and stock tracking'}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Section 1: Basic Info */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Basic Details
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="inv-name" className="text-xs font-semibold text-foreground/90">
                    Item Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="inv-name"
                    placeholder="e.g. Fresh Chicken Breast, Organic Milk, Pizza Sauce"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">SKU / Item Code</Label>
                  <Input
                    placeholder="e.g. CHK-001"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Category</Label>
                  <Input
                    placeholder="e.g. Poultry, Dairy, Dry Pantry, Beverages"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Item Type</Label>
                  <Select value={form.item_type} onValueChange={(v) => set('item_type', v)}>
                    <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(ITEM_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-xs">
                          <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', ITEM_TYPE_COLORS[val as InventoryItemType])}>
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-2.5 border border-border/60">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Active for Recipes</p>
                    <p className="text-[11px] text-muted-foreground">Available for recipe BOM and stock ledger</p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => set('active', v)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Units & Conversion */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Units & Measurements
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">
                    Stock Unit <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={form.stock_unit} onValueChange={(v) => set('stock_unit', v)}>
                    <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      {ALL_UNITS.map((u) => (
                        <SelectItem key={u} value={u} className="text-xs font-mono">{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Purchase Unit</Label>
                  <Select
                    value={form.purchase_unit || '__none__'}
                    onValueChange={(v) => set('purchase_unit', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                      <SelectValue placeholder="Same as stock" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      <SelectItem value="__none__" className="text-xs text-muted-foreground font-sans">Same as stock unit</SelectItem>
                      {ALL_UNITS.map((u) => (
                        <SelectItem key={u} value={u} className="text-xs font-mono">{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Conversion Factor</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={form.unit_conversion_factor}
                    onChange={(e) => set('unit_conversion_factor', parseFloat(e.target.value) || 1)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Stock Thresholds */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                <Gauge className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stock Alert Levels ({form.stock_unit})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400">Min Safety Stock</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={form.min_stock}
                    onChange={(e) => set('min_stock', parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl border-rose-500/30 bg-rose-500/5 focus-visible:ring-rose-500/20 shadow-none text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Triggers critical shortage</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400">Reorder Trigger</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={form.reorder_level}
                    onChange={(e) => set('reorder_level', parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl border-amber-500/30 bg-amber-500/5 focus-visible:ring-amber-500/20 shadow-none text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Flags procurement need</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Par Maximum</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={form.par_level}
                    onChange={(e) => set('par_level', parseFloat(e.target.value) || 0)}
                    className="h-9 rounded-xl border-emerald-500/30 bg-emerald-500/5 focus-visible:ring-emerald-500/20 shadow-none text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Target full inventory</p>
                </div>
              </div>
            </div>

            {/* Section 4: Cost & Supplier */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Procurement & Storage
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">
                    Cost per {form.stock_unit}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">₹</span>
                    <Input
                      type="number" step="0.01" min="0"
                      value={form.cost_per_unit}
                      onChange={(e) => set('cost_per_unit', parseFloat(e.target.value) || 0)}
                      className="h-9 pl-7 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Supplier / Vendor</Label>
                  <Input
                    placeholder="e.g. Apex Meat Supplies"
                    value={form.supplier_name}
                    onChange={(e) => set('supplier_name', e.target.value)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Storage Location</Label>
                  <Input
                    placeholder="e.g. Walk-in Freezer A, Dry Shelf 2"
                    value={form.storage_location}
                    onChange={(e) => set('storage_location', e.target.value)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/90">Internal Notes</Label>
                  <Input
                    placeholder="e.g. Requires chilled transport"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-muted/20 shrink-0">
            <p className="text-xs text-muted-foreground">
              <span className="text-rose-500 font-bold">*</span> Mandatory fields for inventory
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-9 px-4 rounded-xl border-border/70 text-xs font-semibold hover:bg-muted/80 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-5 rounded-xl text-xs font-semibold shadow-md shadow-primary/20 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {item ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
