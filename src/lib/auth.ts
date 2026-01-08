import { createClient, createServiceRoleClient } from './supabase/server';
import { UserRole, User } from './types';
import { redirect } from 'next/navigation';

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(): Promise<User | null> {
  const user = await getUser();

  if (!user) {
    return null;
  }

  // Use service role client to bypass RLS and avoid recursion
  const supabase = createServiceRoleClient();
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as User;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  // Return a session-like object for backward compatibility
  // Most code only needs user.id, so this maintains compatibility
  return { user: { id: user.id } } as { user: { id: string } };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const profile = await getUserProfile();

  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    redirect('/dashboard');
  }

  return { session, profile };
}

export async function checkRole(userId: string, allowedRoles: UserRole[]): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile) {
    return false;
  }

  const profileData = profile as any;
  return allowedRoles.includes(profileData.role as UserRole);
}

/**
 * Get the effective outlet ID for a user profile.
 * For admins: returns current_outlet_id if set, otherwise outlet_id
 * For non-admins: returns outlet_id
 */
export function getEffectiveOutletId(profile: User | null): string | null {
  if (!profile) {
    return null;
  }

  if (profile.role === UserRole.ADMIN) {
    return profile.current_outlet_id || profile.outlet_id || null;
  }

  return profile.outlet_id || null;
}

// Permission Utilities

export async function getUserPermissions(userId: string) {
  const supabase = createServiceRoleClient();

  // 1. Get user with role_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, role_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) return [];
  const user = userData as any;

  // 2. If 'admin', implicit full access (we handle this in checkPermission logic usually, 
  // but let's return a wildcard or handle it at checking time. 
  // For consistency, let's just return no specific permissions and rely on the admin check.)

  if (user.role === 'admin') {
    return 'ADMIN'; // Special marker
  }

  // 3. If has role_id, fetch permissions
  if (user.role_id) {
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*, modules(name)')
      .eq('role_id', user.role_id);

    if (permError) {
      console.error('Error fetching permissions:', permError);
      return [];
    }

    return permissions.map((p: any) => ({
      module: p.modules.name,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete
    }));
  }

  return [];
}

export async function checkPermission(
  userId: string,
  moduleName: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);

  if (permissions === 'ADMIN') return true;

  if (Array.isArray(permissions)) {
    const modulePerm = permissions.find((p: any) => p.module === moduleName);
    if (!modulePerm) return false;

    switch (action) {
      case 'view': return modulePerm.can_view;
      case 'create': return modulePerm.can_create;
      case 'edit': return modulePerm.can_edit;
      case 'delete': return modulePerm.can_delete;
      default: return false;
    }
  }

  return false;
}

export async function requirePermission(
  moduleName: string,
  action: 'view' | 'create' | 'edit' | 'delete'
) {
  const session = await requireAuth();
  const hasPermission = await checkPermission(session.user.id, moduleName, action);

  if (!hasPermission) {
    redirect('/unauthorized');
  }

  return session;
}

