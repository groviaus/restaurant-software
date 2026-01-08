'use client';

import { useState, useEffect } from 'react';
import { Role } from '@/lib/types';
import { RolesTable } from '@/components/roles/RolesTable';
import { RoleForm } from '@/components/roles/RoleForm';
import { Loader2 } from 'lucide-react';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/roles');
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (error) {
            console.error('Failed to fetch roles', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Roles & Permissions</h2>
                    <p className="text-muted-foreground">
                        Manage roles and configure granular access permissions for each module.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <RoleForm onSuccess={fetchRoles} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <RolesTable roles={roles} onRefresh={fetchRoles} />
            )}
        </div>
    );
}
