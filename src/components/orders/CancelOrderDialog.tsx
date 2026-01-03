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
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: OrderStatus.CANCELLED,
          cancellation_reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      setReason('');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
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






