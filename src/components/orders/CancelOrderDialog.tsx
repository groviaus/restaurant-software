'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { OrderStatus } from '@/lib/types';
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/useOrderMutations';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess?: () => void;
}

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
    } catch (_error) {
      // Toast handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Please provide a reason for cancelling this order. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="reason" className="text-xs sm:text-sm">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Customer changed mind, incorrect items added"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none text-base sm:text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              This reason will be recorded and visible in order history.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReason('');
              onOpenChange(false);
            }}
            disabled={loading}
            className="h-11 sm:h-10 mt-2 sm:mt-0"
          >
            Go Back
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={loading || !reason.trim()}
            className="h-11 sm:h-10"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






