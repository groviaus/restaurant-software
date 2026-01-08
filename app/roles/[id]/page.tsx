'use client';

import { useState, useEffect } from 'react';
import { Role, RolePermission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        } catch (error) {
            toast.error('Failed to load role details');
            router.push('/roles');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
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
            toast.success('Role details updated');
        } catch (error) {
            toast.error('Failed to update role');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!role) return null;

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-8 pt-3 sm:pt-4 lg:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push('/roles')}
                    className="h-9 w-9 flex-shrink-0 self-start"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                        Edit Role: {role.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Update role details and configure permissions.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
                {/* Role Details Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Role Details</CardTitle>
                            <CardDescription className="text-sm">Basic information about this role.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateRole} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>
                                <Button type="submit" disabled={saving} className="w-full">
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Details
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Permission Matrix - Takes up 2 columns on large screens */}
                <div className="lg:col-span-2">
                    <PermissionMatrix roleId={role.id} initialPermissions={permissions} />
                </div>
            </div>
        </div>
    );
}
