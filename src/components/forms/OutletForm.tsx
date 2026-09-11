'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Store, MapPin, X, Loader2, Sparkles } from 'lucide-react';

interface OutletFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OutletForm({
  open,
  onOpenChange,
  onSuccess,
}: OutletFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Outlet name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim() || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create outlet');
      }

      toast.success('Outlet created successfully');
      setName('');
      setAddress('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create outlet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card"
      >
        {/* Modern Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                <span>Add New Outlet</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  Branch
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Register a new physical outlet, branch, or cloud kitchen
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="outlet-name" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-muted-foreground" />
              Outlet / Branch Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="outlet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-primary/20 text-sm"
              required
              placeholder="e.g. Connaught Place Flagship, Bandra West"
            />
            <p className="text-[11px] text-muted-foreground">
              Displayed on invoices, customer receipts, and staff floor assignments.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="outlet-address" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Physical Address (Optional)
            </Label>
            <Input
              id="outlet-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-primary/20 text-sm"
              placeholder="e.g. Block B, Inner Circle, Connaught Place, New Delhi"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-border/70"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-9 px-5 text-xs font-semibold rounded-xl shadow-sm gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Create Outlet
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
