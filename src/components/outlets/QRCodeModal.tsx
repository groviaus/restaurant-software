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
import { Label } from '@/components/ui/label';
import { Download, Copy, QrCode, Loader2, ExternalLink, X, Check, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '@/lib/capacitor/download';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  outletName: string;
}

export function QRCodeModal({ open, onOpenChange, outletId, outletName }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://restaurant-software-chi.vercel.app';
  const menuUrl = `${baseUrl}/qr-menu?outlet=${outletId}`;

  useEffect(() => {
    if (open) {
      generateQRCode();
    } else {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
        setQrCodeUrl('');
      }
      setCopied(false);
    }
  }, [open]);

  const generateQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/qr/${outletId}`);

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = async () => {
    if (qrCodeUrl) {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const filename = `qr-menu-${outletName.toLowerCase().replace(/\s+/g, '-')}.png`;
        await downloadFile(blob, filename, 'image/png');
        toast.success('QR code downloaded successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to download QR code');
      }
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success('Digital menu URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleOpenMenu = () => {
    window.open(menuUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] sm:max-w-[440px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card"
      >
        {/* Modern Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-foreground truncate">
                Digital Menu QR
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {outletName}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* QR Display Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-muted/40 to-muted/10 rounded-2xl border border-border/70 relative group">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Generating high-res QR code...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-xs text-destructive font-medium">{error}</p>
                <Button onClick={generateQRCode} variant="outline" size="sm" className="h-8 text-xs rounded-xl">
                  Try Again
                </Button>
              </div>
            ) : qrCodeUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-xl shadow-md ring-1 ring-black/5">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code for ${outletName}`}
                    className="w-52 h-52 object-contain"
                  />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">
                  Scan to order or browse live menu
                </span>
              </div>
            ) : null}
          </div>

          {/* Menu Link Input */}
          <div className="space-y-1.5">
            <Label htmlFor="menu-url-input" className="text-xs font-semibold text-foreground/90">
              Customer Direct URL
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="menu-url-input"
                value={menuUrl}
                readOnly
                className="h-9 font-mono text-xs rounded-xl border-border/70 bg-background/80"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                title="Copy URL"
                className="h-9 w-9 shrink-0 rounded-xl border-border/70"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleOpenMenu}
                title="Preview menu"
                className="h-9 w-9 shrink-0 rounded-xl border-border/70"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-border/70"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleDownloadQR}
              disabled={!qrCodeUrl || loading}
              className="h-9 px-4 text-xs font-semibold rounded-xl shadow-sm gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
