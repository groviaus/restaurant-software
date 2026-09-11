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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MenuItem, InventoryItem, Recipe } from '@/lib/types';
import { ALL_UNITS } from '@/lib/inventory/unitConversions';
import { toast } from 'sonner';
import {
  BookOpen, Plus, Trash2, Loader2, X, ChefHat, AlertCircle,
  FlaskConical, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientRow {
  id: string; // local UI id
  inventory_item_id: string;
  quantity: string;
  unit: string;
  preparation_loss_percent: string;
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
  const [yieldUnit, setYieldUnit] = useState('pcs');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (existingRecipe) {
        setYieldQty(String(existingRecipe.yield_quantity));
        setYieldUnit(existingRecipe.yield_unit);
        setNotes(existingRecipe.notes ?? '');
        setIngredients(
          (existingRecipe.ingredients ?? []).map((ing, i) => ({
            id: `${i}`,
            inventory_item_id: ing.inventory_item_id,
            quantity: String(ing.quantity),
            unit: ing.unit,
            preparation_loss_percent: String(ing.preparation_loss_percent ?? 0),
          }))
        );
      } else {
        setYieldQty('1');
        setYieldUnit('pcs');
        setNotes('');
        setIngredients([]);
      }
    }
  }, [open, existingRecipe]);

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        inventory_item_id: '',
        quantity: '',
        unit: 'g',
        preparation_loss_percent: '0',
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

  // Calculate theoretical cost
  const theoreticalCost = ingredients.reduce((total, ing) => {
    const invItem = inventoryItems.find((i) => i.id === ing.inventory_item_id);
    if (!invItem) return total;
    const qty = parseFloat(ing.quantity) || 0;
    return total + qty * Number(invItem.cost_per_unit);
  }, 0);

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
      toast.error('All ingredients must have an item and valid quantity');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        menu_item_id: menuItem.id,
        yield_quantity: parseFloat(yieldQty) || 1,
        yield_unit: yieldUnit,
        notes: notes || null,
        ingredients: ingredients.map((ing) => ({
          inventory_item_id: ing.inventory_item_id,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          preparation_loss_percent: parseFloat(ing.preparation_loss_percent) || 0,
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
        className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border/70 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Recipe / BOM
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {menuItem.name} — define ingredients for inventory tracking
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingRecipe && (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Recipe set
              </Badge>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Yield Configuration Card */}
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-end gap-3.5">
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs font-semibold text-foreground/90">Batch / Recipe Yield</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={yieldQty}
                  onChange={(e) => setYieldQty(e.target.value)}
                  className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5 w-32">
                <Label className="text-xs font-semibold text-foreground/90">Yield Unit</Label>
                <Select value={yieldUnit} onValueChange={setYieldUnit}>
                  <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pcs" className="text-xs font-mono">pcs</SelectItem>
                    <SelectItem value="portion" className="text-xs font-mono">portion</SelectItem>
                    <SelectItem value="serving" className="text-xs font-mono">serving</SelectItem>
                    <SelectItem value="kg" className="text-xs font-mono">kg</SelectItem>
                    <SelectItem value="l" className="text-xs font-mono">l</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pb-1.5 text-xs text-muted-foreground sm:max-w-[200px] leading-tight">
                Specifies that 1 {yieldUnit} of <span className="font-semibold text-foreground">{menuItem.name}</span> will auto-deduct the ingredients below.
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Required Ingredients ({ingredients.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="h-7 px-2.5 text-xs rounded-lg border-border/70 font-semibold gap-1 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Ingredient
                </Button>
              </div>

              {ingredients.length === 0 && (
                <div className="border-2 border-dashed border-border/70 rounded-xl py-10 text-center bg-muted/10">
                  <FlaskConical className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">No ingredients defined yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                    Add inventory items and quantities to automate kitchen deduction on orders.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {ingredients.map((ing, idx) => {
                  return (
                    <div
                      key={ing.id}
                      className="grid grid-cols-[2.5fr_1fr_1fr_1fr_auto] gap-2.5 items-end bg-muted/25 rounded-xl px-3.5 py-3 border border-border/60 hover:border-border/90 transition-colors shadow-2xs"
                    >
                      {/* Item */}
                      <div className="space-y-1">
                        {idx === 0 && (
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Ingredient
                          </Label>
                        )}
                        <Select
                          value={ing.inventory_item_id}
                          onValueChange={(v) => updateIngredient(ing.id, 'inventory_item_id', v)}
                        >
                          <SelectTrigger className="h-8.5 text-xs rounded-xl border-border/70 bg-background/80 shadow-none">
                            <SelectValue placeholder="Select raw item..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-56">
                            {inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id} className="text-xs">
                                <span className="font-semibold">{item.name}</span>
                                <span className="text-muted-foreground ml-1.5 text-[11px] font-mono">({item.stock_unit})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        {idx === 0 && (
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Qty
                          </Label>
                        )}
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                          className="h-8.5 text-xs font-mono rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none"
                        />
                      </div>

                      {/* Unit */}
                      <div className="space-y-1">
                        {idx === 0 && (
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Unit
                          </Label>
                        )}
                        <Select value={ing.unit} onValueChange={(v) => updateIngredient(ing.id, 'unit', v)}>
                          <SelectTrigger className="h-8.5 text-xs font-mono rounded-xl border-border/70 bg-background/80 shadow-none">
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
                      <div className="space-y-1">
                        {idx === 0 && (
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Loss %
                          </Label>
                        )}
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
                          className="h-8.5 text-xs font-mono rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none"
                        />
                      </div>

                      {/* Remove */}
                      <div className={cn(idx === 0 && 'mt-5')}>
                        <button
                          type="button"
                          onClick={() => removeIngredient(ing.id)}
                          aria-label="Remove ingredient"
                          className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">Kitchen Preparation Notes</Label>
              <Input
                placeholder="e.g. Marinate 4 hours before cooking; peel vegetables before weighing"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
              />
            </div>

            {/* Cost Preview Card */}
            {ingredients.length > 0 && theoreticalCost > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3.5 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Theoretical Cost Breakdown</p>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <p className="text-lg font-bold text-foreground">
                    ₹{theoreticalCost.toFixed(2)}{' '}
                    <span className="font-normal text-xs text-muted-foreground">
                      per {yieldQty} {yieldUnit}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{(theoreticalCost / (parseFloat(yieldQty) || 1)).toFixed(2)} / portion · Menu price: ₹{menuItem.price} · Margin: <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{(menuItem.price - theoreticalCost / (parseFloat(yieldQty) || 1)).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-muted/20 shrink-0">
            <div>
              {existingRecipe && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 h-8.5 px-3 rounded-xl text-xs font-semibold cursor-pointer"
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
