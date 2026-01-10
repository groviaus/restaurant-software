'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';
import { Receipt } from './Receipt';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { useSettings } from '@/hooks/useSettings';

interface BillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  readOnly?: boolean;
}

export function BillModal({ open, onOpenChange, order, readOnly = false }: BillModalProps) {
  const router = useRouter();
  const { markOrderBilled, updateOrder } = useTableOrderStore();
  const { settings } = useSettings();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Calculate subtotal from order items if not present
  const calculateSubtotal = (): number => {
    if (order?.subtotal != null && !isNaN(Number(order.subtotal))) {
      return Number(order.subtotal);
    }
    // Calculate from order items
    const orderItems = order?.order_items || order?.items || [];
    return orderItems.reduce((sum: number, item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };

  // Calculate tax from subtotal using GST settings
  const calculateTax = (subtotal: number): number => {
    if (order?.tax != null && !isNaN(Number(order.tax))) {
      return Number(order.tax);
    }
    // Use GST settings from API
    if (!settings.gst_enabled) {
      return 0;
    }
    // Use gst_percentage from settings, or calculate from CGST + SGST
    const taxRate = settings.gst_percentage 
      ? settings.gst_percentage / 100 
      : ((settings.cgst_percentage || 0) + (settings.sgst_percentage || 0)) / 100;
    return subtotal * taxRate;
  };

  // Calculate totals
  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = order?.total != null && !isNaN(Number(order.total)) 
    ? Number(order.total) 
    : subtotal + tax;

  // Get tax label based on settings
  const getTaxLabel = (): string => {
    if (!settings.gst_enabled) {
      return 'Tax:';
    }
    if (settings.gst_percentage) {
      return `Tax (${settings.gst_percentage}%):`;
    }
    const totalTax = (settings.cgst_percentage || 0) + (settings.sgst_percentage || 0);
    return totalTax > 0 ? `Tax (${totalTax}%):` : 'Tax:';
  };

  const handleGenerateBill = async () => {
    if (order.status === 'COMPLETED') {
      // Just show the receipt
      setBillData({
        order_id: order.id,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        payment_method: order.payment_method,
        items: order.order_items,
        created_at: order.created_at,
      });
      setShowReceipt(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          payment_method: paymentMethod,
          // tax_rate is now optional - backend will use outlet settings
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate bill');
      }

      const data = await response.json();
      
      // Update store - mark order as billed and set table to EMPTY
      markOrderBilled(order.id);
      
      // Also update the order in store with the complete order data if available
      if (data.order_id) {
        // Fetch the updated order to get complete data
        try {
          const orderResponse = await fetch(`/api/orders/${order.id}`);
          if (orderResponse.ok) {
            const updatedOrder = await orderResponse.json();
            updateOrder(updatedOrder);
          }
        } catch (error) {
          // If fetch fails, markOrderBilled already handled the table status
          console.error('Failed to fetch updated order:', error);
        }
      }
      
      setBillData(data);
      setShowReceipt(true);
      toast.success('Bill generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  // If readOnly, show receipt directly
  useEffect(() => {
    if (readOnly && order) {
      setBillData({
        order_id: order.id,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        payment_method: order.payment_method,
        items: order.order_items,
        created_at: order.created_at,
      });
      setShowReceipt(true);
    }
  }, [readOnly, order]);

  if (showReceipt && billData) {
    return (
      <Receipt
        billData={billData}
        order={order}
        onClose={() => {
          setShowReceipt(false);
          onOpenChange(false);
          router.refresh();
        }}
      />
    );
  }

  if (readOnly) {
    return null; // Will show receipt via useEffect
  }

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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerateBill} disabled={loading}>
            {loading ? 'Generating...' : order.status === 'COMPLETED' ? 'View Receipt' : 'Generate Bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

