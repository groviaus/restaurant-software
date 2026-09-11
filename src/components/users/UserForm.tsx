'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Loader2, UserPlus, X, Mail, Lock, User, Shield, Store, Sparkles } from 'lucide-react';
import { Role, Outlet } from '@/lib/types';

interface UserFormProps {
  onSuccess: () => void;
}

export function UserForm({ onSuccess }: UserFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    outlet_id: '',
  });

  useEffect(() => {
    if (open) {
      fetchRoles();
      fetchOutlets();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/outlets');
      if (res.ok) {
        const data = await res.json();
        setOutlets(data.outlets || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch outlets', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }

      toast.success('Staff member account created successfully');
      setFormData({ name: '', email: '', password: '', role_id: '', outlet_id: '' });
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
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
        <UserPlus className="h-4 w-4" />
        Add Staff / User
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card"
        >
          {/* Modern Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/25">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <span>Create User Account</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Grant system access, assign roles, and bind to an outlet
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
              <Label htmlFor="user-name" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="user-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Rahul Sharma"
                className="h-10 rounded-xl border-border/70 bg-background text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="user-email" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Email Address <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="rahul@example.com"
                  className="h-10 rounded-xl border-border/70 bg-background text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-password" className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Password <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-border/70 bg-background text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  Assigned Role
                </Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Administrator (Superuser)</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-muted-foreground" />
                  Assigned Outlet
                </Label>
                <Select
                  value={formData.outlet_id}
                  onValueChange={(value) => setFormData({ ...formData, outlet_id: value })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background text-xs">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={loading}
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
                    Create Account
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
