'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  requiredAction?: 'view' | 'create' | 'edit' | 'delete';
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
  requiredAction = 'view'
}: ProtectedRouteProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const { checkPermission, loading: permLoading } = usePermissions();
  const router = useRouter();

  const loading = authLoading || permLoading;

  // Memoize permission check to avoid re-computing on every render
  const hasPermission = useMemo(() => {
    if (!requiredPermission || !profile) return true;
    return checkPermission(requiredPermission, requiredAction);
  }, [requiredPermission, requiredAction, profile, checkPermission]);

  // Memoize role check
  const hasAllowedRole = useMemo(() => {
    if (!allowedRoles || !profile) return true;
    return allowedRoles.includes(profile.role as UserRole);
  }, [allowedRoles, profile]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Early return if role check fails
      if (allowedRoles && profile && !hasAllowedRole) {
        router.push('/dashboard');
        return;
      }
      
      // Check permission if required
      if (requiredPermission && !hasPermission) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, hasAllowedRole, hasPermission, allowedRoles, requiredPermission, router]);

  // Show loading state immediately
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Early returns for unauthorized access
  if (!user) return null;

  if (allowedRoles && profile && !hasAllowedRole) {
    return null;
  }

  if (requiredPermission && !hasPermission) {
    return null;
  }

  return <>{children}</>;
}

