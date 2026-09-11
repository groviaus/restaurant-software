'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Loader2, Shield, X, Sparkles, FileText } from 'lucide-react';

interface RoleFormProps {
  onSuccess: () => void;
}

export function RoleForm({ onSuccess }: RoleFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create role');
      }

      toast.success('Role created successfully. You can now configure permissions.');
      setFormData({ name: '', description: '' });
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Create Role
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] sm:max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card"
        >
          {/* Modern Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/25">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Create Security Role
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Define a new staff role and customize granular module permissions
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dialog"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-name" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                Role Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="role-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Floor Captain, Head Chef, Cashier"
                required
                className="h-10 rounded-xl border-border/70 bg-background text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-description" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Description / Purpose (Optional)
              </Label>
              <Textarea
                id="role-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of permissions and responsibilities assigned to this role..."
                rows={3}
                className="rounded-xl border-border/70 bg-background text-xs resize-none leading-relaxed"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="h-9 px-4 text-xs font-semibold rounded-xl border-border/70"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
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
                    Save & Configure Matrix
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
