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
import { InventoryItem, InventoryTransactionType } from '@/lib/types';
import { ALL_UNITS } from '@/lib/inventory/unitConversions';
import { toast } from 'sonner';
import { ArrowUpCircle, ArrowDownCircle, Loader2, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRANSACTION_OPTIONS: { value: InventoryTransactionType; label: string; sign: '+' | '-' }[] = [
  { value: InventoryTransactionType.OPENING_STOCK, label: 'Opening Stock', sign: '+' },
  { value: InventoryTransactionType.PURCHASE, label: 'Purchase / Received', sign: '+' },
  { value: InventoryTransactionType.PRODUCTION, label: 'Production', sign: '+' },
  { value: InventoryTransactionType.TRANSFER_IN, label: 'Transfer In', sign: '+' },
  { value: InventoryTransactionType.MANUAL_ADJUSTMENT, label: 'Manual Adjustment', sign: '+' },
  { value: InventoryTransactionType.WASTAGE, label: 'Wastage', sign: '-' },
  { value: InventoryTransactionType.SPOILAGE, label: 'Spoilage', sign: '-' },
  { value: InventoryTransactionType.DAMAGE, label: 'Damage', sign: '-' },
  { value: InventoryTransactionType.TRANSFER_OUT, label: 'Transfer Out', sign: '-' },
  { value: InventoryTransactionType.STOCK_COUNT_ADJUSTMENT, label: 'Stock Count Adjustment', sign: '-' },
  { value: InventoryTransactionType.PURCHASE_RETURN, label: 'Purchase Return', sign: '-' },
];

const STOCK_OUT_TYPES = new Set([
  InventoryTransactionType.WASTAGE,
  InventoryTransactionType.SPOILAGE,
  InventoryTransactionType.DAMAGE,
  InventoryTransactionType.TRANSFER_OUT,
  InventoryTransactionType.PURCHASE_RETURN,
]);

const REASON_REQUIRED = new Set([
  InventoryTransactionType.MANUAL_ADJUSTMENT,
  InventoryTransactionType.STOCK_COUNT_ADJUSTMENT,
  InventoryTransactionType.DAMAGE,
]);

interface RecordMovementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  preSelectedItemId?: string;
  outletId: string;
  onSuccess: () => void;
}

export function RecordMovementForm({
  open,
  onOpenChange,
  inventoryItems,
  preSelectedItemId,
  outletId,
  onSuccess,
}: RecordMovementFormProps) {
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [transactionType, setTransactionType] = useState<InventoryTransactionType>(
    InventoryTransactionType.OPENING_STOCK
  );
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isStockOut = STOCK_OUT_TYPES.has(transactionType);
  const isReasonRequired = REASON_REQUIRED.has(transactionType);
  const selectedItem = inventoryItems.find((i) => i.id === inventoryItemId);

  useEffect(() => {
    if (open) {
      setInventoryItemId(preSelectedItemId ?? '');
      setTransactionType(InventoryTransactionType.OPENING_STOCK);
      setQuantity('');
      setReason('');
      setNotes('');
    }
  }, [open, preSelectedItemId]);

  // Auto-set unit from selected item
  useEffect(() => {
    if (selectedItem) {
      setUnit(selectedItem.stock_unit);
    }
  }, [selectedItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryItemId) { toast.error('Select an inventory item'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    if (isReasonRequired && !reason.trim()) { toast.error('Reason is required for this transaction type'); return; }

    setLoading(true);
    try {
      const quantityChange = isStockOut ? -qty : qty;

      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          transaction_type: transactionType,
          quantity_change: quantityChange,
          unit,
          reason: reason || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record movement');

      toast.success(
        `${isStockOut ? 'Stock removed' : 'Stock added'}: ${qty} ${unit} — ${selectedItem?.name}`
      );
      onSuccess();
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
        className="max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border/70 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              isStockOut ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            )}>
              {isStockOut
                ? <ArrowDownCircle className="w-5 h-5" />
                : <ArrowUpCircle className="w-5 h-5" />
              }
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Record Stock Movement
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Every change creates an immutable ledger entry
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
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5">
            {/* Current Stock Banner */}
            {selectedItem && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs text-primary font-semibold">{selectedItem.name}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    Current Stock: <span className="font-mono text-primary">{selectedItem.current_stock}</span> {selectedItem.stock_unit}
                  </p>
                </div>
                {selectedItem.current_stock <= selectedItem.min_stock && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Low Stock
                  </Badge>
                )}
              </div>
            )}

            {/* Item Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">
                Inventory Item <span className="text-rose-500">*</span>
              </Label>
              <Select value={inventoryItemId} onValueChange={setInventoryItemId} required>
                <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                  <SelectValue placeholder="Select raw material or ingredient..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-muted-foreground ml-2 text-[11px] font-mono">
                        ({item.current_stock} {item.stock_unit})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">
                Movement Type <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={transactionType}
                onValueChange={(v) => setTransactionType(v as InventoryTransactionType)}
              >
                <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Stock In (+ Increment)
                  </div>
                  {TRANSACTION_OPTIONS.filter((t) => t.sign === '+').map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1.5">+</span>
                      {opt.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider mt-1 border-t border-border/50">
                    Stock Out (− Decrement)
                  </div>
                  {TRANSACTION_OPTIONS.filter((t) => t.sign === '-').map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span className="text-rose-500 font-bold mr-1.5">−</span>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90">
                  Quantity <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90">Unit of Measure</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {ALL_UNITS.map((u) => (
                      <SelectItem key={u} value={u} className="text-xs font-mono">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">
                Adjustment Reason
                {isReasonRequired && <span className="text-rose-500 ml-1">*</span>}
              </Label>
              <Input
                placeholder={isReasonRequired ? 'Required — e.g. Supplier delivery, spoilage discard' : 'Optional movement reason'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs"
                required={isReasonRequired}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">Audit Notes</Label>
              <Textarea
                placeholder="Optional ledger audit remarks, invoice number, or batch reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[64px] rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs resize-none"
                rows={2}
              />
            </div>

            {/* Preview Banner */}
            {selectedItem && quantity && parseFloat(quantity) > 0 && (
              <div className={cn(
                'rounded-xl border p-3.5 shadow-2xs transition-all',
                isStockOut
                  ? 'border-rose-500/25 bg-rose-500/10 text-rose-950 dark:text-rose-200'
                  : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
              )}>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-75 mb-1">Stock Impact Preview</p>
                <p className={cn(
                  'text-base font-bold font-mono',
                  isStockOut ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {isStockOut ? '−' : '+'}{parseFloat(quantity) || 0} {unit}
                </p>
                <p className="text-xs opacity-80 mt-1 font-medium">
                  {selectedItem.current_stock} → {' '}
                  <span className="font-bold underline decoration-dotted">
                    {(Number(selectedItem.current_stock) + (isStockOut ? -parseFloat(quantity) : parseFloat(quantity))).toFixed(3).replace(/\.?0+$/, '')} {selectedItem.stock_unit}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-muted/20 shrink-0">
            <p className="text-xs text-muted-foreground">Immutable audit entry</p>
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
                className={cn(
                  'h-9 px-5 rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-all',
                  isStockOut
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                )}
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Record Movement
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
