'use client';

import { useState, useEffect } from 'react';
import { Role, RolePermission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Shield, FileText, CheckCircle2, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { toast } from 'sonner';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchRoleDetails();
    }
  }, [id]);

  const fetchRoleDetails = async () => {
    try {
      const res = await fetch(`/api/roles/${id}`);
      if (!res.ok) throw new Error('Failed to fetch role');

      const data = await res.json();
      setRole(data);
      setPermissions(data.permissions || []);
      setFormData({
        name: data.name,
        description: data.description || '',
      });
    } catch {
      toast.error('Failed to load role details');
      router.push('/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update role');
      toast.success('Role details updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/roles')}
            className="h-9 w-9 rounded-xl border-border/70 hover:bg-muted/80 cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate flex items-center gap-2">
                Role: {loading ? <Skeleton className="h-7 w-32 rounded-md inline-block" /> : (role?.name || 'Untitled Role')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Security Profile
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Update role identification and configure permission capabilities
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Role Details Form */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60 space-y-1">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Role Properties
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Base identity and description of responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ) : (
                <form onSubmit={handleUpdateRole} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground/90">
                      Role Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-10 rounded-xl border-border/70 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-desc" className="text-xs font-semibold text-foreground/90">
                      Role Description
                    </Label>
                    <Textarea
                      id="edit-desc"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Describe staff responsibilities..."
                      className="rounded-xl border-border/70 bg-background text-xs resize-none leading-relaxed"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={saving || !formData.name.trim()}
                    className="w-full h-9 rounded-xl text-xs font-semibold shadow-sm gap-1.5 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Update Role Name
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2">
          <PermissionMatrix roleId={role?.id || id} initialPermissions={permissions} />
        </div>
      </div>
    </div>
  );
}
