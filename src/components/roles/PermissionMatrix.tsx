'use client';

import { useState, useEffect } from 'react';
import { Module, RolePermission } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, Eye, PenSquare, Trash2, Plus, CheckCheck, X, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PermissionMatrixProps {
  roleId: string;
  initialPermissions: RolePermission[];
}

export function PermissionMatrix({ roleId, initialPermissions }: PermissionMatrixProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Record<string, RolePermission>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchModules();
    const permMap: Record<string, RolePermission> = {};
    initialPermissions.forEach((p) => {
      permMap[p.module_id] = p;
    });
    setPermissions(permMap);
  }, [initialPermissions]);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Failed to fetch modules', error);
      toast.error('Failed to load modules list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (
    moduleId: string,
    field: keyof Omit<RolePermission, 'id' | 'role_id' | 'module_id' | 'created_at' | 'updated_at' | 'module'>
  ) => {
    setPermissions((prev) => {
      const current = prev[moduleId] || {
        role_id: roleId,
        module_id: moduleId,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      };

      return {
        ...prev,
        [moduleId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  const handleGrantAllForModule = (moduleId: string, grant: boolean) => {
    setPermissions((prev) => {
      const current = prev[moduleId] || {
        id: '',
        role_id: roleId,
        module_id: moduleId,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return {
        ...prev,
        [moduleId]: {
          ...current,
          can_view: grant,
          can_create: grant,
          can_edit: grant,
          can_delete: grant,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.values(permissions).map((p) => ({
        module_id: p.module_id,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }));

      const res = await fetch('/api/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId, permissions: payload }),
      });

      if (!res.ok) throw new Error('Failed to save permissions');

      toast.success('Permissions updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };



  return (
    <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-muted/20 border-b border-border/60">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Module Permissions Matrix
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Check privileges to grant View, Create, Edit, and Delete access per system module
          </CardDescription>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Permissions
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
                <TableHead className="py-3 pl-5 text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                  System Module
                </TableHead>
                <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                  View
                </TableHead>
                <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                  Create
                </TableHead>
                <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                  Edit
                </TableHead>
                <TableHead className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                  Delete
                </TableHead>
                <TableHead className="py-3 pr-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider w-[120px]">
                  Quick Fill
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-border/50">
                    <TableCell className="py-3 pl-5">
                      <Skeleton className="h-4 w-32 rounded-md mb-1.5" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Skeleton className="h-4 w-4 rounded-md mx-auto" />
                    </TableCell>
                    <TableCell className="py-3 pr-5 text-right">
                      <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                modules.map((module) => {
                const perm = permissions[module.id] || {
                  can_view: false,
                  can_create: false,
                  can_edit: false,
                  can_delete: false,
                };
                const allChecked = perm.can_view && perm.can_create && perm.can_edit && perm.can_delete;

                return (
                  <TableRow
                    key={module.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <TableCell className="py-3 pl-5 font-semibold text-xs text-foreground">
                      {module.display_name}
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        {module.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Checkbox
                        checked={perm.can_view}
                        onCheckedChange={() => handleToggle(module.id, 'can_view')}
                        className="rounded-md data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Checkbox
                        checked={perm.can_create}
                        onCheckedChange={() => handleToggle(module.id, 'can_create')}
                        className="rounded-md data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Checkbox
                        checked={perm.can_edit}
                        onCheckedChange={() => handleToggle(module.id, 'can_edit')}
                        className="rounded-md data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Checkbox
                        checked={perm.can_delete}
                        onCheckedChange={() => handleToggle(module.id, 'can_delete')}
                        className="rounded-md data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="py-3 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleGrantAllForModule(module.id, !allChecked)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        {allChecked ? 'Revoke All' : 'Grant All'}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden p-3 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="rounded-xl border border-border/70 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              </Card>
            ))
          ) : (
            modules.map((module) => {
            const perm = permissions[module.id] || {
              can_view: false,
              can_create: false,
              can_edit: false,
              can_delete: false,
            };

            return (
              <Card key={module.id} className="rounded-xl border border-border/70 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-foreground">{module.display_name}</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">{module.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                    <Label className="text-xs font-medium">View</Label>
                    <Switch
                      checked={perm.can_view}
                      onCheckedChange={() => handleToggle(module.id, 'can_view')}
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                    <Label className="text-xs font-medium">Create</Label>
                    <Switch
                      checked={perm.can_create}
                      onCheckedChange={() => handleToggle(module.id, 'can_create')}
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                    <Label className="text-xs font-medium">Edit</Label>
                    <Switch
                      checked={perm.can_edit}
                      onCheckedChange={() => handleToggle(module.id, 'can_edit')}
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                    <Label className="text-xs font-medium">Delete</Label>
                    <Switch
                      checked={perm.can_delete}
                      onCheckedChange={() => handleToggle(module.id, 'can_delete')}
                    />
                  </div>
                </div>
              </Card>
            );
          })
        )}
        </div>
      </CardContent>
    </Card>
  );
}
