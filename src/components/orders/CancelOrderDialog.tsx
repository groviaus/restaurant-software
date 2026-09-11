'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { OrderStatus } from '@/lib/types';
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/useOrderMutations';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess?: () => void;
}

const QUICK_REASONS = [
  'Customer changed mind',
  'Kitchen out of stock',
  'Entered incorrect items',
  'Duplicate order',
  'Excessive wait time',
];

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderId,
  onSuccess,
}: CancelOrderDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const cancelOrderMutation = useUpdateOrderStatusMutation();
  const loading = cancelOrderMutation.isPending;

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await cancelOrderMutation.mutateAsync({
        orderId,
        status: OrderStatus.CANCELLED,
        cancellation_reason: reason.trim(),
      });
      setReason('');
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch {
      // Toast handled in mutation
    }
  };

  const handleQuickReasonClick = (selectedReason: string) => {
    setReason(selectedReason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none max-h-none rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[92vw] sm:max-w-[480px] md:max-w-[540px] sm:h-auto sm:rounded-2xl sm:border border-border/60 bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Mobile-First Header: No Bulky Icon Containers */}
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <DialogTitle className="text-sm sm:text-base font-bold text-rose-700 dark:text-rose-400">
              Cancel Order #{orderId ? orderId.slice(0, 8) : ''}
            </DialogTitle>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setReason('');
              onOpenChange(false);
            }}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto custom-scrollbar">
          {/* Quick preset chips for rapid 1-tap entry */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Select Reason:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => {
                const isSelected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickReasonClick(r)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer border',
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cancellation reason textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason" className="text-xs font-semibold text-foreground">
              Remarks
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Provide reason or choose a preset above..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none rounded-xl border-border/60 bg-background/70 text-xs font-medium focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Mobile-First Sticky Footer */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex items-center gap-2 mt-auto flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReason('');
              onOpenChange(false);
            }}
            disabled={loading}
            className="h-9.5 px-4 text-xs font-medium rounded-xl border-border/60 cursor-pointer"
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={loading || !reason.trim()}
            className="h-9.5 flex-1 px-4 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
          >
            {loading ? 'Cancelling...' : 'Void & Cancel Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
