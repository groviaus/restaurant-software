'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && profile && !allowedRoles.includes(profile.role as UserRole)) {
        router.push('/dashboard');
      } else if (requiredPermission) {
        const hasPerm = checkPermission(requiredPermission, requiredAction);
        if (!hasPerm) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, profile, loading, allowedRoles, requiredPermission, requiredAction, router, checkPermission]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role as UserRole)) {
    return null;
  }

  if (requiredPermission && !checkPermission(requiredPermission, requiredAction)) {
    return null;
  }

  return <>{children}</>;
}

