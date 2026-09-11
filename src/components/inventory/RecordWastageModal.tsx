'use client';

import { useState } from 'react';
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
import { InventoryItem } from '@/lib/types';
import { toast } from 'sonner';
import { Trash2, Loader2, AlertOctagon } from 'lucide-react';

interface RecordWastageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  onSuccess: () => void;
}

const WASTAGE_REASONS = [
  'Spoilage',
  'Expired',
  'Overproduction',
  'Preparation waste',
  'Damaged',
  'Dropped',
  'Other',
];

export function RecordWastageModal({
  open,
  onOpenChange,
  inventoryItems,
  onSuccess,
}: RecordWastageModalProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Spoilage');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedItem = inventoryItems.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }
    const numQty = parseFloat(quantity);
    if (!numQty || numQty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inventory/wastage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_item_id: selectedItem.id,
          quantity: numQty,
          unit: selectedItem.stock_unit,
          reason,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record wastage');

      toast.success(
        `Recorded ${numQty} ${selectedItem.stock_unit} wastage for ${selectedItem.name}`
      );
      onOpenChange(false);
      setSelectedItemId('');
      setQuantity('');
      setNotes('');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card">
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Record Wastage & Loss
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Deduct spoiled, expired, or damaged inventory with an audit trail
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">Inventory Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                  <SelectValue placeholder="Select raw material or ingredient..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-muted-foreground ml-2 text-[11px] font-mono">
                        (Current: {item.current_stock} {item.stock_unit})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90">Quantity Wasted</Label>
                <Input
                  type="number"
                  step="any"
                  min="0.001"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="h-9 rounded-xl border-border/70 bg-background/80 focus-visible:ring-primary/20 shadow-none text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90">Stock Unit</Label>
                <Input
                  value={selectedItem?.stock_unit || '—'}
                  disabled
                  className="h-9 rounded-xl bg-muted/60 text-muted-foreground border-border/50 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">Wastage Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-9 rounded-xl border-border/70 bg-background/80 shadow-none text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {WASTAGE_REASONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/90">Notes / Explanation</Label>
              <Textarea
                placeholder="e.g. Left out overnight, batch expired, dropped during prep..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none text-xs rounded-xl border-border/70 bg-background/80 shadow-none focus-visible:ring-primary/20 min-h-[64px]"
              />
            </div>

            {selectedItem && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
                <AlertOctagon className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  Current stock is <strong className="font-mono">{selectedItem.current_stock} {selectedItem.stock_unit}</strong>.
                  {parseFloat(quantity) > 0 && (
                    <span>
                      {' '}After deduction: <strong className="font-mono text-foreground font-bold">{(Number(selectedItem.current_stock) - parseFloat(quantity)).toFixed(2)} {selectedItem.stock_unit}</strong>.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground">Logged with audit entry</p>
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
                disabled={loading || !selectedItemId || !quantity}
                className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Confirm Wastage
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
