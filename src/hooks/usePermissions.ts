'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '@/lib/types';

interface PermissionCache {
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

export function usePermissions() {
    const { profile, loading: authLoading } = useAuth();
    const [permissions, setPermissions] = useState<PermissionCache[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && profile) {
            if (profile.role === 'admin') {
                setLoading(false);
                return; // Admin ignores permission array check typically
            }

            if (profile.role_id) {
                // Fetch permissions for custom role
                fetchPermissions(profile.role_id);
            } else {
                // Legacy roles (cashier/staff) - map to default permissions locally or fetch if migrated
                // For now, assume legacy roles have their hardcoded access and empty array means "check legacy logic"
                setLoading(false);
            }
        } else if (!authLoading && !profile) {
            setLoading(false);
        }
    }, [profile, authLoading]);

    const fetchPermissions = async (roleId: string) => {
        try {
            // We can create an API endpoint for getting MY permissions or use the role endpoint if allowed.
            // But role_permissions table has RLS allowing users to view their own permissions.
            // We can query Supabase directly using client.
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const { data, error } = await supabase
                .from('role_permissions')
                .select('*, modules(name)')
                .eq('role_id', roleId);

            if (error) throw error;

            const perms = data.map((p: any) => ({
                module: p.modules.name,
                can_view: p.can_view,
                can_create: p.can_create,
                can_edit: p.can_edit,
                can_delete: p.can_delete
            }));

            setPermissions(perms);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        } finally {
            setLoading(false);
        }
    };

    const checkPermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete') => {
        if (loading) return false;
        if (!profile) return false;
        if (profile.role === 'admin') return true;

        // Check custom permissions first
        if (permissions.length > 0) {
            const perm = permissions.find(p => p.module === moduleName);
            if (perm) {
                switch (action) {
                    case 'view': return perm.can_view;
                    case 'create': return perm.can_create;
                    case 'edit': return perm.can_edit;
                    case 'delete': return perm.can_delete;
                }
            }
            // If module permission explicit entry missing for custom role, deny access
            if (profile.role_id) return false;
        }

        // Fallback Legacy Logic (if no custom role assigned or permissions empty)
        // This maintains backward compatibility for existing 'cashier'/'staff' roles
        if (profile.role === 'cashier') {
            // Cashier can view everything usually, but maybe restrict Reports?
            // Based on typical logic:
            if (moduleName === 'reports' || moduleName === 'roles' || moduleName === 'users') return false;
            if (action === 'delete') return false; // Cashiers usually can't delete
            return true;
        }

        if (profile.role === 'staff') {
            // Staff (waiter) logic
            if (['orders', 'menu', 'tables'].includes(moduleName) && action === 'view') return true;
            if (moduleName === 'orders' && action === 'create') return true;
            return false;
        }

        return false;
    };

    return {
        permissions,
        loading: loading || authLoading,
        checkPermission,
        isAdmin: profile?.role === 'admin'
    };
}
