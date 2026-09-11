'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InventoryItem, StockCountStatus } from '@/lib/types';
import { formatStockDisplay } from '@/lib/inventory/unitConversions';
import { toast } from 'sonner';
import {
  ClipboardCheck, Loader2, X, CheckCircle, AlertTriangle,
  XCircle, ArrowRight, Plus, Minus, Search, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountItem {
  inventory_item_id: string;
  inventory_item: InventoryItem;
  system_quantity: number;
  physical_quantity: string;
  unit: string;
  notes: string;
}

interface StockCountWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  outletId: string;
  onSuccess: () => void;
}

type Step = 'setup' | 'counting' | 'review' | 'done';

export function StockCountWorkflow({
  open,
  onOpenChange,
  inventoryItems,
  outletId,
  onSuccess,
}: StockCountWorkflowProps) {
  const [step, setStep] = useState<Step>('setup');
  const [countId, setCountId] = useState<string | null>(null);
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setStep('setup');
      setCountId(null);
      setNotes('');
      setSearch('');
      setCountItems(
        inventoryItems.map((item) => ({
          inventory_item_id: item.id,
          inventory_item: item,
          system_quantity: Number(item.current_stock),
          physical_quantity: '',
          unit: item.stock_unit,
          notes: '',
        }))
      );
    }
  }, [open, inventoryItems]);

  const startCount = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/stock-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start count');
      setCountId(data.count.id);
      setStep('counting');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePhysical = (itemId: string, value: string) => {
    setCountItems((prev) =>
      prev.map((ci) =>
        ci.inventory_item_id === itemId ? { ...ci, physical_quantity: value } : ci
      )
    );
  };

  const saveProgress = async () => {
    if (!countId) return;
    setLoading(true);
    try {
      const itemsToSave = countItems
        .filter((ci) => ci.physical_quantity !== '')
        .map((ci) => ({
          inventory_item_id: ci.inventory_item_id,
          physical_quantity: parseFloat(ci.physical_quantity) || 0,
          notes: ci.notes || null,
        }));

      const res = await fetch('/api/inventory/stock-count', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: countId,
          status: StockCountStatus.IN_PROGRESS,
          items: itemsToSave,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success('Progress saved');
      setStep('review');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeCount = async () => {
    if (!countId) return;
    if (!confirm('Finalize this stock count? This will create adjustment transactions for all variances.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/inventory/stock-count', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: countId,
          status: StockCountStatus.FINALIZED,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to finalize');
      toast.success('Stock count finalized — inventory adjusted');
      setStep('done');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = countItems.filter((ci) =>
    !search || ci.inventory_item.name.toLowerCase().includes(search.toLowerCase())
  );

  const countedItems = countItems.filter((ci) => ci.physical_quantity !== '');
  const variances = countItems.filter((ci) => {
    if (ci.physical_quantity === '') return false;
    const variance = parseFloat(ci.physical_quantity) - ci.system_quantity;
    return Math.abs(variance) >= 0.001;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border/70 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Physical Stock Count
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {step === 'setup' && 'Start a new physical inventory count'}
                {step === 'counting' && `Counting ${countItems.length} items — ${countedItems.length} counted`}
                {step === 'review' && `Review ${variances.length} variances before finalizing`}
                {step === 'done' && 'Stock count finalized'}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {(['setup', 'counting', 'review', 'done'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      step === s
                        ? 'bg-emerald-600 text-white'
                        : ['setup', 'counting', 'review', 'done'].indexOf(step) > i
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < 3 && <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/50" />}
                </div>
              ))}
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Setup */}
          {step === 'setup' && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">How Physical Audits Work</p>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>System creates an immediate immutable snapshot of active stock balances</li>
                  <li>Enter the actual physical count found during shelf or freezer inspection</li>
                  <li>Discrepancies and variances are flagged in real time</li>
                  <li>Finalizing writes ledger reconciliation movements for all variances</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/90">Audit Notes / Reason (optional)</label>
                <Input
                  placeholder="e.g. End of Day Closing Count, Weekly Meat Audit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                />
              </div>
              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Items Scheduled for Audit</p>
                  <p className="text-[11px] text-muted-foreground">All active ingredients and raw items in this outlet</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-primary/10 border-primary/20 text-primary">
                  {inventoryItems.length} items
                </Badge>
              </div>
            </div>
          )}

          {/* Step 2: Counting */}
          {step === 'counting' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by item name or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs"
                  />
                </div>
                <Badge variant="outline" className="text-xs font-mono font-semibold px-2.5 py-1.5 border-border/70 bg-muted/40">
                  {countedItems.length} / {countItems.length} counted
                </Badge>
              </div>

              <div className="space-y-1.5">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr] gap-3 px-3.5 py-2 bg-muted/40 rounded-xl border border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Inventory Item</span>
                  <span>System Stock</span>
                  <span>Physical Count</span>
                  <span>Variance</span>
                </div>

                {filteredItems.map((ci) => {
                  const physQty = ci.physical_quantity !== '' ? parseFloat(ci.physical_quantity) : null;
                  const variance = physQty !== null ? physQty - ci.system_quantity : null;
                  const hasVariance = variance !== null && Math.abs(variance) >= 0.001;
                  const isCounted = ci.physical_quantity !== '';

                  return (
                    <div
                      key={ci.inventory_item_id}
                      className={cn(
                        'grid grid-cols-[2fr_1fr_1.2fr_1fr] gap-3 px-3.5 py-2.5 rounded-xl border transition-all items-center',
                        isCounted
                          ? hasVariance
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-card border-border/60 hover:border-border/90'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {ci.inventory_item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">{ci.inventory_item.category || ci.unit}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-mono font-medium">
                          {formatStockDisplay(ci.system_quantity, ci.unit)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.00"
                            value={ci.physical_quantity}
                            onChange={(e) => updatePhysical(ci.inventory_item_id, e.target.value)}
                            className="h-8 w-24 text-xs font-mono font-semibold text-center rounded-lg border-border/80 bg-background/90 shadow-none"
                          />
                          <span className="text-[11px] text-muted-foreground font-mono">{ci.unit}</span>
                        </div>
                      </div>
                      <div>
                        {variance !== null ? (
                          <span className={cn(
                            'text-xs font-bold font-mono',
                            variance > 0 ? 'text-emerald-600 dark:text-emerald-400' : variance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                          )}>
                            {variance >= 0 ? '+' : ''}{variance.toFixed(3).replace(/\.?0+$/, '')} {ci.unit}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3.5">
                <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 text-center shadow-2xs">
                  <p className="text-xl font-bold font-mono text-foreground">{countedItems.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Items Counted</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 text-center shadow-2xs">
                  <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{variances.length}</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">With Variance</p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-center shadow-2xs">
                  <p className="text-xl font-bold font-mono text-primary">
                    {countItems.length - countedItems.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Uncounted</p>
                </div>
              </div>

              {variances.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Variance Breakdown ({variances.length})
                  </h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {variances.map((ci) => {
                      const physQty = parseFloat(ci.physical_quantity);
                      const variance = physQty - ci.system_quantity;
                      return (
                        <div
                          key={ci.inventory_item_id}
                          className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 shadow-2xs"
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{ci.inventory_item.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              System: {formatStockDisplay(ci.system_quantity, ci.unit)} → Physical: {formatStockDisplay(physQty, ci.unit)}
                            </p>
                          </div>
                          <span className={cn(
                            'text-xs font-bold font-mono px-2.5 py-1 rounded-lg border',
                            variance > 0
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          )}>
                            {variance >= 0 ? '+' : ''}{variance.toFixed(3).replace(/\.?0+$/, '')} {ci.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {variances.length === 0 && countedItems.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Perfect match! No variances detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Physical count matches system ledger with 100% precision.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-foreground">Stock Count Reconciled & Finalized</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Adjustment transactions have been recorded in the inventory ledger. All stock balances are updated.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-muted/20 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-xl border-border/70 text-xs font-semibold hover:bg-muted/80 cursor-pointer"
          >
            {step === 'done' ? 'Close' : 'Cancel'}
          </Button>
          <div className="flex gap-2.5">
            {step === 'setup' && (
              <Button
                onClick={startCount}
                disabled={loading}
                className="h-9 px-5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Start Physical Count
              </Button>
            )}
            {step === 'counting' && (
              <Button
                onClick={saveProgress}
                disabled={loading || countedItems.length === 0}
                className="h-9 px-5 rounded-xl text-xs font-semibold shadow-md shadow-primary/20 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save & Review ({countedItems.length})
              </Button>
            )}
            {step === 'review' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('counting')}
                  className="h-9 px-4 rounded-xl border-border/70 text-xs font-semibold cursor-pointer"
                >
                  Back to Count
                </Button>
                <Button
                  onClick={finalizeCount}
                  disabled={loading}
                  className="h-9 px-5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Finalize & Apply Adjustments
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
