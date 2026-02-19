'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentMethod } from '@/lib/types';
import { Receipt } from './Receipt';
import { useSettings } from '@/hooks/useSettings';
import { useGenerateBillMutation } from '@/hooks/mutations/useOrderMutations';

interface BillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  readOnly?: boolean;
}

export function BillModal({ open, onOpenChange, order, readOnly = false }: BillModalProps) {
  const { settings } = useSettings();
  const generateBillMutation = useGenerateBillMutation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [billData, setBillData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const calculateSubtotal = (): number => {
    if (order?.subtotal != null && !isNaN(Number(order.subtotal))) {
      return Number(order.subtotal);
    }
    const orderItems = order?.order_items || order?.items || [];
    return orderItems.reduce((sum: number, item: any) => {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  };

  const calculateTax = (subtotal: number): number => {
    if (order?.tax != null && !isNaN(Number(order.tax))) {
      return Number(order.tax);
    }
    if (!settings.gst_enabled) return 0;
    const taxRate = settings.gst_percentage
      ? settings.gst_percentage / 100
      : ((settings.cgst_percentage || 0) + (settings.sgst_percentage || 0)) / 100;
    return subtotal * taxRate;
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = order?.total != null && !isNaN(Number(order.total))
    ? Number(order.total)
    : subtotal + tax;

  const getTaxLabel = (): string => {
    if (!settings.gst_enabled) return 'Tax:';
    if (settings.gst_percentage) return `Tax (${settings.gst_percentage}%):`;
    const totalTax = (settings.cgst_percentage || 0) + (settings.sgst_percentage || 0);
    return totalTax > 0 ? `Tax (${totalTax}%):` : 'Tax:';
  };

  const buildBillData = (method: string) => ({
    order_id: order.id,
    subtotal,
    tax,
    total,
    payment_method: method,
    items: order.order_items,
    created_at: order.created_at,
  });

  const handleGenerateBill = () => {
    if (order.status === 'COMPLETED') {
      setBillData(buildBillData(order.payment_method || PaymentMethod.CASH));
      setShowReceipt(true);
      return;
    }

    // Build receipt data from what we already have — show instantly
    const optimisticBillData = buildBillData(paymentMethod);
    setBillData(optimisticBillData);
    setShowReceipt(true);

    // Fire billing API in background — onMutate already updates the orders cache
    generateBillMutation.mutate({
      orderId: order.id,
      paymentMethod,
      optimisticBillData,
    });
  };

  // readOnly: show receipt directly (e.g. re-printing a completed order)
  useEffect(() => {
    if (readOnly && order) {
      setBillData(buildBillData(order.payment_method || PaymentMethod.CASH));
      setShowReceipt(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, order]);

  if (showReceipt && billData) {
    return (
      <Receipt
        billData={billData}
        order={order}
        onClose={() => {
          setShowReceipt(false);
          onOpenChange(false);
        }}
      />
    );
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Bill</DialogTitle>
          <DialogDescription>
            Select payment method and generate the bill for this order
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                <SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
                <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{getTaxLabel()}</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateBill}>
            {order.status === 'COMPLETED' ? 'View Receipt' : 'Generate Bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
