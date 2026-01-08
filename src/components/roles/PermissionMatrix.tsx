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
import { Loader2, Save, Eye, PenSquare, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
        // Initialize permissions map from props
        const permMap: Record<string, RolePermission> = {};
        initialPermissions.forEach(p => {
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

    const handleToggle = (moduleId: string, field: keyof Omit<RolePermission, 'id' | 'role_id' | 'module_id' | 'created_at' | 'updated_at' | 'module'>) => {
        setPermissions(prev => {
            const current = prev[moduleId] || {
                role_id: roleId,
                module_id: moduleId,
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false
            };

            return {
                ...prev,
                [moduleId]: {
                    ...current,
                    [field]: !current[field]
                }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // transform map to array
            const payload = Object.values(permissions).map(p => ({
                module_id: p.module_id,
                can_view: p.can_view,
                can_create: p.can_create,
                can_edit: p.can_edit,
                can_delete: p.can_delete
            }));

            const res = await fetch('/api/role-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role_id: roleId, permissions: payload })
            });

            if (!res.ok) throw new Error('Failed to save permissions');

            toast.success('Permissions updated successfully');
        } catch (error) {
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    // Mobile Permission Card
    const MobilePermissionCard = ({ module }: { module: Module }) => {
        const perm = permissions[module.id] || {
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false
        };

        return (
            <Card className="mb-3">
                <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-3">{module.display_name}</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label className="text-xs font-normal">View</Label>
                            </div>
                            <Switch
                                checked={perm.can_view}
                                onCheckedChange={() => handleToggle(module.id, 'can_view')}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label className="text-xs font-normal">Create</Label>
                            </div>
                            <Switch
                                checked={perm.can_create}
                                onCheckedChange={() => handleToggle(module.id, 'can_create')}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <PenSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label className="text-xs font-normal">Edit</Label>
                            </div>
                            <Switch
                                checked={perm.can_edit}
                                onCheckedChange={() => handleToggle(module.id, 'can_edit')}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label className="text-xs font-normal">Delete</Label>
                            </div>
                            <Switch
                                checked={perm.can_delete}
                                onCheckedChange={() => handleToggle(module.id, 'can_delete')}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                    <CardTitle className="text-lg sm:text-xl">Permissions</CardTitle>
                    <CardDescription className="text-sm">Manage access rights for this role.</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[200px]">Module</TableHead>
                                <TableHead className="text-center w-[80px]">View</TableHead>
                                <TableHead className="text-center w-[80px]">Create</TableHead>
                                <TableHead className="text-center w-[80px]">Edit</TableHead>
                                <TableHead className="text-center w-[80px]">Delete</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modules.map((module) => {
                                const perm = permissions[module.id] || {
                                    can_view: false,
                                    can_create: false,
                                    can_edit: false,
                                    can_delete: false
                                };

                                return (
                                    <TableRow key={module.id}>
                                        <TableCell className="font-medium">
                                            {module.display_name}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_view}
                                                onCheckedChange={() => handleToggle(module.id, 'can_view')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_create}
                                                onCheckedChange={() => handleToggle(module.id, 'can_create')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_edit}
                                                onCheckedChange={() => handleToggle(module.id, 'can_edit')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={perm.can_delete}
                                                onCheckedChange={() => handleToggle(module.id, 'can_delete')}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {modules.map((module) => (
                        <MobilePermissionCard key={module.id} module={module} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
