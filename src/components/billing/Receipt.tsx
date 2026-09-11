'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, QrCode, X, CheckCircle2, Utensils, ShoppingBag, User, Loader2 } from 'lucide-react';
import { getQuantityTypeLabel } from '@/lib/utils/quantity';
import { PaymentMethod, QuantityType } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ReceiptProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any;
  onClose: () => void;
}

function WhatsAppIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.02.79.81-2.95-.19-.3a8.188 8.188 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.3z" />
    </svg>
  );
}

export function Receipt({ billData, order, onClose }: ReceiptProps) {
  const [isSharing, setIsSharing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Get items from billData or fallback to order.order_items
  const items = billData.items && Array.isArray(billData.items) && billData.items.length > 0
    ? billData.items
    : (order?.order_items || order?.items || []);

  // Calculate values if they are NaN or missing
  const calculateSubtotal = (): number => {
    if (billData.subtotal != null && !isNaN(Number(billData.subtotal))) {
      return Number(billData.subtotal);
    }
    if (!items || items.length === 0) {
      return 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.reduce((sum: number, item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const calculateTax = (): number => {
    if (billData.tax != null && !isNaN(Number(billData.tax))) {
      return Number(billData.tax);
    }
    return 0;
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = billData.total != null && !isNaN(Number(billData.total))
    ? Number(billData.total)
    : subtotal + tax;

  const isDineIn = order?.order_type === 'DINE_IN';
  const tableName = order?.tables?.name || order?.table?.name;
  const staffName = order?.users?.name || order?.users?.email || order?.user?.name || order?.user?.email || 'Staff';
  const orderDate = billData.created_at ? new Date(billData.created_at) : new Date();
  const invoiceNum = billData.order_id ? billData.order_id.slice(0, 8).toUpperCase() : 'RECEIPT';

  const handleShareToWhatsApp = async () => {
    if (!receiptRef.current) return;

    setIsSharing(true);
    const toastId = toast.loading('Generating receipt image...');

    try {
      // Dynamically import html-to-image to keep initial bundle size lean
      const { toBlob } = await import('html-to-image');

      const blob = await toBlob(receiptRef.current, {
        quality: 0.95,
        pixelRatio: 3, // Ultra-crisp 3x DPI for sharp thermal typography
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (!blob) {
        throw new Error('Could not create receipt image');
      }

      const fileName = `Receipt-${invoiceNum}.png`;

      // 1. Check if running inside Capacitor native mobile app
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.split(',')[1] || res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: `Receipt #${invoiceNum}`,
          text: `Tax Invoice & Receipt #${invoiceNum} (Total: ₹${total.toFixed(2)})`,
          url: savedFile.uri,
          dialogTitle: 'Share Receipt to WhatsApp',
        });

        toast.dismiss(toastId);
        toast.success('Receipt ready to share!');
        return;
      }

      // 2. Check Web Share API with files (iOS Safari, Android Chrome, mobile browsers)
      const file = new File([blob], fileName, { type: 'image/png' });
      let canShareFile = false;
      try {
        if (typeof navigator !== 'undefined' && 'canShare' in navigator && typeof navigator.canShare === 'function') {
          canShareFile = navigator.canShare({ files: [file] });
        }
      } catch {
        canShareFile = false;
      }

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: `Receipt #${invoiceNum}`,
            text: `Tax Invoice & Receipt #${invoiceNum} (Total: ₹${total.toFixed(2)})`,
          });
          toast.dismiss(toastId);
          toast.success('Receipt shared successfully!');
          return;
        } catch (shareErr: unknown) {
          if ((shareErr as { name?: string })?.name === 'AbortError') {
            // User cancelled share sheet
            toast.dismiss(toastId);
            return;
          }
          console.warn('Web Share failed, falling back:', shareErr);
        }
      }

      // 3. Desktop / Browser fallback:
      // (A) Copy image directly to clipboard so user can instantly paste (Ctrl+V) into WhatsApp
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
        } catch (clipboardErr) {
          console.warn('Clipboard write fallback failed:', clipboardErr);
        }
      }

      // (B) Auto-download the high-res PNG file
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);

      // (C) Open WhatsApp with prefilled message
      const waText = encodeURIComponent(
        `*RestoPOS Tax Invoice & Receipt #${invoiceNum}*\nTotal: ₹${total.toFixed(2)}\n\n_Receipt PNG image downloaded and copied to clipboard. You can paste (Ctrl+V) or attach it in chat._`
      );
      window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');

      toast.dismiss(toastId);
      toast.success('Receipt image downloaded & WhatsApp opened! Paste or attach file in chat.');
    } catch (error: unknown) {
      console.error('Failed to share receipt:', error);
      toast.dismiss(toastId);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to share receipt: ${msg}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto max-w-none sm:max-w-lg md:max-w-xl rounded-none sm:rounded-2xl border-0 sm:border border-border/60 bg-card text-card-foreground shadow-2xl overflow-y-auto flex flex-col print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:p-0">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-border/60 bg-muted/40 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Receipt</span>
            <span className="text-xs text-muted-foreground font-mono">#{invoiceNum}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WhatsApp Share Button */}
            <Button
              size="sm"
              onClick={handleShareToWhatsApp}
              disabled={isSharing}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              title="Convert receipt to PNG and share to WhatsApp as file"
            >
              {isSharing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <WhatsAppIcon className="h-3.5 w-3.5" />
              )}
              <span>{isSharing ? 'Sharing...' : 'Share'}</span>
            </Button>

            {/* Print Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border-border/80 hover:bg-muted text-foreground cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            {/* Close Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Close Receipt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thermal Receipt Body (Target for exact PNG capture) */}
        <div
          ref={receiptRef}
          className="p-5 sm:p-7 space-y-4 font-sans bg-white text-zinc-950 flex-1 select-none"
        >
          {/* Brand Header */}
          <div className="text-center space-y-1 border-b border-zinc-200 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              RestoPOS
            </h2>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
              Tax Invoice & Receipt
            </p>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-2 gap-y-2.5 text-xs border-b border-zinc-200 pb-4">
            <div className="space-y-0.5">
              <span className="text-zinc-500 block text-[11px]">Invoice #</span>
              <span className="font-mono font-bold text-zinc-950">
                {invoiceNum}
              </span>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-zinc-500 block text-[11px]">Date & Time</span>
              <span className="font-medium text-zinc-950">
                {format(orderDate, 'dd MMM yyyy, HH:mm')}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-zinc-500 block text-[11px]">Order Type</span>
              <span className="inline-flex items-center gap-1 font-semibold text-zinc-950">
                {isDineIn ? (
                  <>
                    <Utensils className="h-3 w-3 text-emerald-600" />
                    <span>Table {tableName || 'Dine-In'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-3 w-3 text-zinc-600" />
                    <span>Takeaway</span>
                  </>
                )}
              </span>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-zinc-500 block text-[11px]">Billed By</span>
              <span className="inline-flex items-center gap-1 font-medium text-zinc-950 justify-end">
                <User className="h-3 w-3 text-zinc-600" />
                <span>{staffName}</span>
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
                  <th className="text-left py-2 font-semibold">Item</th>
                  <th className="text-center py-2 font-semibold w-16">Qty</th>
                  <th className="text-right py-2 font-semibold w-20">Rate</th>
                  <th className="text-right py-2 font-semibold w-20">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-zinc-400 italic">
                      No item details recorded
                    </td>
                  </tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  items.map((item: any, idx: number) => {
                    const itemPrice = Number(item.price) || 0;
                    const itemQuantity = Number(item.quantity) || 1;
                    const lineTotal = itemPrice * itemQuantity;
                    const itemName = item.items?.name || item.item?.name || item.item_name || 'Item';
                    return (
                      <tr key={item.id || idx} className="py-2.5">
                        <td className="py-2.5 pr-2">
                          <div className="font-semibold text-zinc-950">
                            {itemName}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-zinc-500 italic">
                              Note: {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-zinc-600 font-medium">
                          {item.quantity_type ? getQuantityTypeLabel(item.quantity_type as QuantityType) : `${itemQuantity}x`}
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-600">
                          ₹{itemPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-zinc-950">
                          ₹{lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="space-y-2 border-t border-zinc-200 pt-4 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-mono text-zinc-950">₹{subtotal.toFixed(2)}</span>
            </div>

            {tax > 0 ? (
              <div className="flex justify-between text-zinc-600">
                <span>Tax (GST)</span>
                <span className="font-mono text-zinc-950">₹{tax.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-zinc-600">
                <span>Tax</span>
                <span className="font-mono text-zinc-950">₹0.00</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 border-t-2 border-zinc-900">
              <span className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Total Paid
              </span>
              <span className="font-mono text-xl font-black text-zinc-950">
                ₹{total.toFixed(2)}
              </span>
            </div>

            {/* Payment Method Banner */}
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-600">
              <span>Payment Tender:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-950 px-2 py-0.5 rounded-md bg-zinc-100">
                {billData.payment_method === PaymentMethod.UPI ? (
                  <>
                    <QrCode className="h-3.5 w-3.5 text-violet-600" />
                    <span>UPI Digital Payment</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{billData.payment_method || 'Cash'}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Footer Receipt Note */}
          <div className="text-center pt-4 border-t border-dashed border-zinc-200 text-[11px] text-zinc-500 space-y-1">
            <p className="font-medium text-zinc-950">Thank you for dining with us!</p>
            <p>Please visit again soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
