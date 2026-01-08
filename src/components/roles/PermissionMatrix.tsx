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
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Permissions</CardTitle>
                    <CardDescription>Manage access rights for this role across different modules.</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Module</TableHead>
                                <TableHead className="text-center">View</TableHead>
                                <TableHead className="text-center">Create</TableHead>
                                <TableHead className="text-center">Edit</TableHead>
                                <TableHead className="text-center">Delete</TableHead>
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
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {/* We could render icon here if mapping available */}
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
            </CardContent>
        </Card>
    );
}
