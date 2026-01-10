'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '@/lib/types';

interface PermissionCache {
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

// Timeout constant for permission fetches (5 seconds)
const PERMISSIONS_FETCH_TIMEOUT = 5000;
// Maximum time for permissions initialization (8 seconds)
const PERMISSIONS_INIT_MAX_TIMEOUT = 8000;

export function usePermissions() {
    const { profile, loading: authLoading } = useAuth();
    const [permissions, setPermissions] = useState<PermissionCache[]>([]);
    const [loading, setLoading] = useState(true);
    const isFetchingRef = useRef(false);
    const mountedRef = useRef(true);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        
        // Safety timeout - ensure loading is always set to false after max time
        initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && loading) {
                console.warn('Permissions initialization timeout - forcing loading to false');
                setLoading(false);
            }
        }, PERMISSIONS_INIT_MAX_TIMEOUT);
        
        return () => {
            mountedRef.current = false;
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Always set loading based on authLoading first
        if (authLoading) {
            setLoading(true);
            return;
        }

        // Auth is done loading
        if (!profile) {
            // No profile means no permissions needed
            if (mountedRef.current) {
                setPermissions([]);
                setLoading(false);
            }
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
            return;
        }

        // We have a profile, determine permissions
        if (profile.role === 'admin') {
            // Admin has full access, no need to fetch
            if (mountedRef.current) {
                setPermissions([]);
                setLoading(false);
            }
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
            return;
        }

        if (profile.role_id) {
            // Fetch permissions for custom role
            if (!isFetchingRef.current) {
                fetchPermissions(profile.role_id).finally(() => {
                    if (initTimeoutRef.current) {
                        clearTimeout(initTimeoutRef.current);
                        initTimeoutRef.current = null;
                    }
                });
            }
        } else {
            // Legacy roles (cashier/staff) - no custom permissions to fetch
            if (mountedRef.current) {
                setPermissions([]);
                setLoading(false);
            }
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
        }
    }, [profile, authLoading]);

    const fetchPermissions = async (roleId: string) => {
        if (isFetchingRef.current) return;
        
        isFetchingRef.current = true;
        setLoading(true);

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Permissions fetch timeout')), PERMISSIONS_FETCH_TIMEOUT);
            });

            // We can create an API endpoint for getting MY permissions or use the role endpoint if allowed.
            // But role_permissions table has RLS allowing users to view their own permissions.
            // We can query Supabase directly using client.
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const permissionsPromise = supabase
                .from('role_permissions')
                .select('*, modules(name)')
                .eq('role_id', roleId);

            const { data, error } = await Promise.race([permissionsPromise, timeoutPromise]);

            if (!mountedRef.current) return;

            if (error) {
                console.error('Failed to fetch permissions:', error);
                // On error, set empty permissions but allow navigation
                setPermissions([]);
            } else if (data) {
                // Filter out any entries where modules is null and map to permission cache
                const perms = data
                    .filter((p: any) => p.modules && p.modules.name) // Only include entries with valid module
                    .map((p: any) => ({
                        module: p.modules.name,
                        can_view: p.can_view,
                        can_create: p.can_create,
                        can_edit: p.can_edit,
                        can_delete: p.can_delete
                    }));

                console.log('Fetched permissions:', perms);
                setPermissions(perms);
            } else {
                console.warn('No permissions data returned');
                setPermissions([]);
            }
        } catch (error: any) {
            if (!mountedRef.current) return;
            
            if (error?.message === 'Permissions fetch timeout') {
                console.warn('Permissions fetch timed out');
            } else {
                console.error('Failed to fetch permissions:', error);
            }
            // On timeout or error, set empty permissions but allow navigation
            setPermissions([]);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
            isFetchingRef.current = false;
        }
    };

    const checkPermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete') => {
        if (loading) return false;
        if (!profile) return false;
        if (profile.role === 'admin') return true;

        // If user has a custom role_id, we MUST check permissions array
        // Don't fall back to legacy logic for custom roles
        if (profile.role_id) {
            // If permissions are still loading or empty, deny access
            if (permissions.length === 0) {
                console.log(`Permission denied: ${moduleName}.${action} - custom role but no permissions loaded yet`, { 
                    role_id: profile.role_id,
                    loading 
                });
                return false;
            }

            // Check for the specific module permission (case-insensitive matching)
            const perm = permissions.find(p => p.module?.toLowerCase() === moduleName.toLowerCase());
            if (perm) {
                const result = (() => {
                    switch (action) {
                        case 'view': return perm.can_view;
                        case 'create': return perm.can_create;
                        case 'edit': return perm.can_edit;
                        case 'delete': return perm.can_delete;
                    }
                })();
                console.log(`Permission check: ${moduleName}.${action} = ${result}`, { perm, allPermissions: permissions });
                return result;
            }
            
            // Module permission not found for custom role - deny access
            console.log(`Permission denied: ${moduleName}.${action} - module not found in permissions`, { 
                moduleName, 
                availableModules: permissions.map(p => p.module),
                allPermissions: permissions 
            });
            return false;
        }

        // Fallback Legacy Logic (only for users without custom role_id)
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
