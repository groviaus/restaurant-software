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
import { Badge } from '@/components/ui/badge';
import { MenuItem, InventoryItem, Recipe } from '@/lib/types';
import { ALL_UNITS, convertUnit } from '@/lib/inventory/unitConversions';
import { toast } from 'sonner';
import {
  Plus, Trash2, Loader2, X, ChefHat,
  FlaskConical, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientRow {
  id: string;
  inventory_item_id: string;
  quantity: string;
  unit: string;
  preparation_loss_percent: string;
  notes: string;
}

interface RecipeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem;
  inventoryItems: InventoryItem[];
  existingRecipe?: Recipe | null;
  outletId: string;
  onSuccess: () => void;
}

export function RecipeBuilder({
  open,
  onOpenChange,
  menuItem,
  inventoryItems,
  existingRecipe,
  outletId,
  onSuccess,
}: RecipeBuilderProps) {
  const [yieldQty, setYieldQty] = useState('1');
  const [yieldUnit, setYieldUnit] = useState('portion');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (existingRecipe) {
        setYieldQty(
          existingRecipe.yield_quantity != null ? String(existingRecipe.yield_quantity) : '1'
        );
        setYieldUnit(existingRecipe.yield_unit || 'portion');
        setNotes(existingRecipe.notes ?? '');

        // Support both ingredients and recipe_ingredients from DB join
        const rawIngredients =
          existingRecipe.ingredients ?? (existingRecipe as any).recipe_ingredients ?? [];

        setIngredients(
          rawIngredients.map((ing: any, i: number) => ({
            id: ing.id ? String(ing.id) : `ing-${i}-${Date.now()}`,
            inventory_item_id: ing.inventory_item_id || '',
            quantity: ing.quantity != null ? String(ing.quantity) : '',
            unit: ing.unit || 'g',
            preparation_loss_percent: String(ing.preparation_loss_percent ?? 0),
            notes: ing.notes ?? '',
          }))
        );
      } else {
        setYieldQty('1');
        setYieldUnit('portion');
        setNotes('');
        setIngredients([]);
      }
    }
  }, [open, existingRecipe]);

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        inventory_item_id: '',
        quantity: '',
        unit: 'g',
        preparation_loss_percent: '0',
        notes: '',
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((r) => r.id !== id));
  };

  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        // Auto-set unit from inventory item
        if (field === 'inventory_item_id') {
          const item = inventoryItems.find((i) => i.id === value);
          if (item) updated.unit = item.stock_unit;
        }
        return updated;
      })
    );
  };

  // Calculate single ingredient cost accounting for prep loss and unit conversion
  const calculateIngredientCost = (ing: IngredientRow) => {
    const invItem = inventoryItems.find((i) => i.id === ing.inventory_item_id);
    if (!invItem) return 0;
    const qty = parseFloat(ing.quantity) || 0;
    if (qty <= 0) return 0;

    const loss = parseFloat(ing.preparation_loss_percent) || 0;
    const effectiveQty = loss > 0 && loss < 100 ? qty / (1 - loss / 100) : qty;
    const converted = convertUnit(effectiveQty, ing.unit, invItem.stock_unit) ?? effectiveQty;
    return converted * Number(invItem.cost_per_unit || 0);
  };

  // Total recipe theoretical cost
  const theoreticalCost = ingredients.reduce((total, ing) => total + calculateIngredientCost(ing), 0);
  const parsedYield = parseFloat(yieldQty) || 1;
  const costPerPortion = parsedYield > 0 ? theoreticalCost / parsedYield : theoreticalCost;
  const menuPrice = Number(menuItem.price || 0);
  const margin = menuPrice > 0 ? menuPrice - costPerPortion : 0;
  const foodCostPercent = menuPrice > 0 ? (costPerPortion / menuPrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredients.length) {
      toast.error('Add at least one ingredient to the recipe');
      return;
    }

    const invalid = ingredients.find(
      (ing) => !ing.inventory_item_id || !ing.quantity || parseFloat(ing.quantity) <= 0
    );
    if (invalid) {
      toast.error('All ingredients must select an inventory item and valid quantity (> 0)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        menu_item_id: menuItem.id,
        yield_quantity: parseFloat(yieldQty) || 1,
        yield_unit: yieldUnit || 'portion',
        notes: notes.trim() || null,
        ingredients: ingredients.map((ing) => ({
          inventory_item_id: ing.inventory_item_id,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          preparation_loss_percent: parseFloat(ing.preparation_loss_percent) || 0,
          notes: ing.notes.trim() || null,
        })),
      };

      const res = await fetch('/api/inventory/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save recipe');

      toast.success('Recipe saved successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecipe) return;
    if (!confirm(`Delete the recipe for "${menuItem.name}"? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/recipes?menu_item_id=${menuItem.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete recipe');
      }
      toast.success('Recipe deleted');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl sm:max-w-4xl w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border/70 shadow-2xl bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-base font-semibold text-foreground">
                  Recipe / Bill of Materials (BOM)
                </DialogTitle>
                {existingRecipe ? (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Recipe active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/70 bg-muted/30">
                    Draft
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{menuItem.name}</span>
                {menuItem.category ? ` (${menuItem.category})` : ''} · Menu Price: ₹{menuPrice.toFixed(2)}
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Yield Configuration Card */}
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="space-y-1.5 w-44 shrink-0">
                <Label className="text-xs font-semibold text-foreground/90 whitespace-nowrap">
                  Batch / Recipe Yield
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1"
                  value={yieldQty}
                  onChange={(e) => setYieldQty(e.target.value)}
                  className="h-9 rounded-xl border-border/70 bg-background focus-visible:ring-primary/20 shadow-none text-xs font-mono font-medium"
                />
              </div>

              <div className="space-y-1.5 w-40 shrink-0">
                <Label className="text-xs font-semibold text-foreground/90 whitespace-nowrap">
                  Yield Unit
                </Label>
                <Select value={yieldUnit} onValueChange={setYieldUnit}>
                  <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background shadow-none text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="portion" className="text-xs font-mono">portion</SelectItem>
                    <SelectItem value="pcs" className="text-xs font-mono">pcs</SelectItem>
                    <SelectItem value="serving" className="text-xs font-mono">serving</SelectItem>
                    <SelectItem value="plate" className="text-xs font-mono">plate</SelectItem>
                    <SelectItem value="kg" className="text-xs font-mono">kg</SelectItem>
                    <SelectItem value="l" className="text-xs font-mono">l</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 bg-background/80 border border-border/50 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
                Specifies that each batch of{' '}
                <span className="font-semibold text-foreground font-mono">{yieldQty || '1'} {yieldUnit}</span> of{' '}
                <span className="font-semibold text-foreground">{menuItem.name}</span> ordered automatically deducts the raw inventory items below.
              </div>
            </div>

            {/* Ingredients Table Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Required Ingredients ({ingredients.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="h-8 px-3 text-xs rounded-lg border-primary/30 text-primary font-semibold gap-1.5 hover:bg-primary/10 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Ingredient
                </Button>
              </div>

              {ingredients.length === 0 ? (
                <div className="border-2 border-dashed border-border/70 rounded-xl py-12 text-center bg-muted/10">
                  <FlaskConical className="w-9 h-9 text-muted-foreground/50 mx-auto mb-2.5" />
                  <p className="text-sm font-semibold text-foreground">No ingredients defined yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Add inventory items, required quantities, and prep loss to automate kitchen deduction on orders.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                    className="mt-4 h-8 px-4 text-xs rounded-xl font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add First Ingredient
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Column Headers */}
                  <div className="grid grid-cols-[3.2fr_1.1fr_1fr_1.1fr_1fr_auto] gap-3 px-3.5 py-2 bg-muted/50 rounded-xl text-[11px] font-bold uppercase tracking-wider text-muted-foreground border border-border/50">
                    <div>Raw Inventory Item</div>
                    <div>Deduct Qty</div>
                    <div>Unit</div>
                    <div>Prep Loss %</div>
                    <div className="text-right">Est. Cost</div>
                    <div className="w-8"></div>
                  </div>

                  {/* Ingredient Rows */}
                  {ingredients.map((ing) => {
                    const cost = calculateIngredientCost(ing);
                    const selectedItem = inventoryItems.find((i) => i.id === ing.inventory_item_id);

                    return (
                      <div
                        key={ing.id}
                        className="bg-card rounded-xl p-3 border border-border/60 hover:border-border/90 transition-colors shadow-2xs space-y-2"
                      >
                        <div className="grid grid-cols-[3.2fr_1.1fr_1fr_1.1fr_1fr_auto] gap-3 items-center">
                          {/* Item Selector */}
                          <div>
                            <Select
                              value={ing.inventory_item_id}
                              onValueChange={(v) => updateIngredient(ing.id, 'inventory_item_id', v)}
                            >
                              <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background shadow-none">
                                <SelectValue placeholder="Select raw inventory item..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl max-h-60">
                                {inventoryItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id} className="text-xs py-2">
                                    <div className="flex items-center justify-between gap-3 w-full">
                                      <span className="font-semibold text-foreground">{item.name}</span>
                                      <span className="text-muted-foreground text-[11px] font-mono">
                                        ₹{Number(item.cost_per_unit || 0).toFixed(2)}/{item.stock_unit} · {Number(item.current_stock).toFixed(1)} in stock
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder="0"
                              value={ing.quantity}
                              onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                              className="h-9 text-xs font-mono font-medium rounded-xl border-border/70 bg-background focus-visible:ring-primary/20 shadow-none"
                            />
                          </div>

                          {/* Unit */}
                          <div>
                            <Select value={ing.unit} onValueChange={(v) => updateIngredient(ing.id, 'unit', v)}>
                              <SelectTrigger className="h-9 text-xs font-mono rounded-xl border-border/70 bg-background shadow-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl max-h-56">
                                {ALL_UNITS.map((u) => (
                                  <SelectItem key={u} value={u} className="text-xs font-mono">{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Loss % */}
                          <div>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={ing.preparation_loss_percent}
                              onChange={(e) =>
                                updateIngredient(ing.id, 'preparation_loss_percent', e.target.value)
                              }
                              className="h-9 text-xs font-mono rounded-xl border-border/70 bg-background focus-visible:ring-primary/20 shadow-none"
                            />
                          </div>

                          {/* Estimated Cost */}
                          <div className="text-right">
                            <span className="text-xs font-mono font-semibold text-foreground">
                              ₹{cost.toFixed(2)}
                            </span>
                          </div>

                          {/* Remove button */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeIngredient(ing.id)}
                              aria-label="Remove ingredient"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Optional ingredient note */}
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">
                            Note:
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 2 bone-in curry cut pieces marinade, or parboiled to 70%"
                            value={ing.notes}
                            onChange={(e) => updateIngredient(ing.id, 'notes', e.target.value)}
                            className="h-6 flex-1 text-[11px] bg-transparent border-b border-border/40 focus:border-primary/50 outline-none text-muted-foreground focus:text-foreground placeholder:text-muted-foreground/40 transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Kitchen Preparation Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">Kitchen Preparation Notes</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Marinate 4 hours before cooking; peel vegetables before weighing; slow dum 35 mins"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border-border/70 bg-background focus-visible:ring-primary/20 shadow-none text-xs leading-relaxed resize-none"
              />
            </div>

            {/* Cost Preview Card */}
            {ingredients.length > 0 && theoreticalCost > 0 && (
              <div className="bg-gradient-to-r from-primary/5 via-indigo-500/5 to-primary/5 border border-primary/20 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Theoretical Recipe Cost Breakdown</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-background/80 rounded-lg p-2.5 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Batch Cost</p>
                    <p className="text-base font-bold text-foreground font-mono mt-0.5">
                      ₹{theoreticalCost.toFixed(2)}{' '}
                      <span className="text-[11px] font-normal text-muted-foreground">
                        / {yieldQty || '1'} {yieldUnit}
                      </span>
                    </p>
                  </div>
                  <div className="bg-background/80 rounded-lg p-2.5 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Cost Per Portion</p>
                    <p className="text-base font-bold text-foreground font-mono mt-0.5">
                      ₹{costPerPortion.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-background/80 rounded-lg p-2.5 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Gross Margin ({menuPrice > 0 ? `${(100 - foodCostPercent).toFixed(1)}%` : '—'})</p>
                    <p className={cn(
                      "text-base font-bold font-mono mt-0.5",
                      margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      ₹{margin.toFixed(2)}{' '}
                      <span className="text-[11px] font-normal text-muted-foreground">
                        (Food cost: {foodCostPercent.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0">
            <div>
              {existingRecipe && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 h-9 px-3 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Recipe
                </Button>
              )}
            </div>
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
                {existingRecipe ? 'Update Recipe' : 'Save Recipe'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
