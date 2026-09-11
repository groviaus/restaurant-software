'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '@/lib/types';
import { Receipt } from './Receipt';
import { useSettings } from '@/hooks/useSettings';
import { useGenerateBillMutation } from '@/hooks/mutations/useOrderMutations';
import {
  Receipt as ReceiptIcon,
  Banknote,
  QrCode,
  CreditCard,
  Utensils,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any;
  readOnly?: boolean;
}

export function BillModal({ open, onOpenChange, order, readOnly = false }: BillModalProps) {
  const { settings } = useSettings();
  const generateBillMutation = useGenerateBillMutation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [billData, setBillData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const calculateSubtotal = (): number => {
    if (order?.subtotal != null && !isNaN(Number(order.subtotal))) {
      return Number(order.subtotal);
    }
    const orderItems = order?.order_items || order?.items || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return orderItems.reduce((sum: number, item: any) => {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  };

  const calculateTax = (subtotalVal: number): number => {
    if (order?.tax != null && !isNaN(Number(order.tax))) {
      return Number(order.tax);
    }
    if (!settings.gst_enabled) return 0;
    const taxRate = settings.gst_percentage
      ? settings.gst_percentage / 100
      : ((settings.cgst_percentage || 0) + (settings.sgst_percentage || 0)) / 100;
    return subtotalVal * taxRate;
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
    order_id: order?.id,
    subtotal,
    tax,
    total,
    payment_method: method,
    items: order?.order_items || order?.items || [],
    created_at: order?.created_at,
  });

  const handleGenerateBill = () => {
    if (!order) return;

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

  const isAlreadyBilled = order?.status === 'COMPLETED' || readOnly;

  // readOnly or completed: show receipt directly (no intermediate settlement screen)
  useEffect(() => {
    if (isAlreadyBilled && order && open) {
      setBillData(buildBillData(order.payment_method || PaymentMethod.CASH));
      setShowReceipt(true);
    } else if (!open) {
      setShowReceipt(false);
      setBillData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlreadyBilled, order, open]);

  // If order is already completed/billed or showReceipt is active, display Receipt directly
  if (open && (showReceipt || isAlreadyBilled)) {
    const activeBillData = billData || buildBillData(order?.payment_method || PaymentMethod.CASH);
    return (
      <Receipt
        billData={activeBillData}
        order={order}
        onClose={() => {
          setShowReceipt(false);
          setBillData(null);
          onOpenChange(false);
        }}
      />
    );
  }

  if (isAlreadyBilled) return null;

  const itemCount = (order?.order_items || order?.items || []).length;
  const isDineIn = order?.order_type === 'DINE_IN';
  const tableName = order?.tables?.name || order?.table?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none max-h-none rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[94vw] sm:max-w-[560px] md:max-w-[820px] lg:max-w-[900px] sm:h-[90vh] md:h-[86vh] sm:max-h-[92vh] md:max-h-[760px] md:min-h-[580px] sm:rounded-2xl sm:border border-border/60 bg-card/98 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Mobile & Laptop Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
              {order?.status === 'COMPLETED' ? 'Order Bill' : 'Settle Bill'}
            </DialogTitle>
            <span className="text-xs text-muted-foreground font-mono font-medium">
              #{order?.id ? order.id.slice(0, 6) : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDineIn ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Utensils className="h-3 w-3" />
                {tableName || 'Dine-In'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border/60">
                <ShoppingBag className="h-3 w-3" />
                Takeaway
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal Body: 1 Column on Mobile, 2 Balanced Columns on Laptop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch h-full">
            {/* Left Column (Order Items Summary) */}
            <div className="md:col-span-6 flex flex-col h-full">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col h-full">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-2 border-b border-border/40">
                  <span className="font-bold text-foreground">Order Summary</span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono text-[11px] font-semibold border border-border/50">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="divide-y divide-border/40 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[180px] md:max-h-[380px]">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(order?.order_items || order?.items || []).map((item: any, idx: number) => {
                    const name = item.item?.name || item.items?.name || item.item_name || 'Dish';
                    const qty = item.quantity || 1;
                    const price = Number(item.price) || 0;
                    return (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-foreground truncate flex-1 pr-2">
                          <span className="font-semibold text-primary mr-1.5">{qty}×</span>
                          {name}
                        </span>
                        <span className="font-mono text-muted-foreground font-medium flex-shrink-0">
                          ₹{(price * qty).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (Tender & Financial Breakdown) */}
            <div className="md:col-span-6 flex flex-col space-y-4">
              {/* Payment Method Selector Tiles */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Payment Tender</Label>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    {
                      id: PaymentMethod.CASH,
                      label: 'Cash',
                      icon: Banknote,
                      color: 'text-emerald-600 dark:text-emerald-400',
                      activeBg: 'border-emerald-500/40 bg-emerald-500/10 shadow-xs',
                    },
                    {
                      id: PaymentMethod.UPI,
                      label: 'UPI / QR',
                      icon: QrCode,
                      color: 'text-violet-600 dark:text-violet-400',
                      activeBg: 'border-violet-500/40 bg-violet-500/10 shadow-xs',
                    },
                    {
                      id: PaymentMethod.CARD,
                      label: 'Card',
                      icon: CreditCard,
                      color: 'text-sky-600 dark:text-sky-400',
                      activeBg: 'border-sky-500/40 bg-sky-500/10 shadow-xs',
                    },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative min-h-[70px]',
                          isSelected
                            ? cn(method.activeBg, 'ring-1 ring-primary/40')
                            : 'border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <IconComponent className={cn('h-5 w-5 mb-1.5', isSelected ? method.color : 'text-muted-foreground')} />
                        <span className="text-xs font-bold text-foreground">{method.label}</span>
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Items Total</span>
                  <span className="font-mono font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                </div>

                {tax > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{getTaxLabel()}</span>
                    <span className="font-mono font-medium text-foreground">₹{tax.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-border/60 flex items-baseline justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">Amount Payable</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-mono text-xl sm:text-2xl font-black text-primary">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Mobile/Desktop Bottom Actions */}
        <div className="p-3.5 sm:p-4 sm:px-6 bg-muted/30 border-t border-border/60 flex items-center justify-end gap-2.5 mt-auto flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 text-xs font-medium rounded-xl border-border/60 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerateBill}
            className="h-10 px-6 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <ReceiptIcon className="h-4 w-4" />
            <span>{order?.status === 'COMPLETED' ? 'View Thermal Receipt' : 'Complete & Generate Bill'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
