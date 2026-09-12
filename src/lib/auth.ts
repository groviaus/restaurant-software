import { createClient, createServiceRoleClient } from './supabase/server';
import { UserRole, User } from './types';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

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

// In-memory server-side TTL cache for user profiles & permissions (60s TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const profileCache = new Map<string, CacheEntry<User | null>>();
const permissionsCache = new Map<string, CacheEntry<any>>();
const AUTH_CACHE_TTL = 60 * 1000;

export function invalidateUserAuthCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
    permissionsCache.delete(userId);
  } else {
    profileCache.clear();
    permissionsCache.clear();
  }
}

export async function getUserProfile(): Promise<User | null> {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const now = Date.now();
  const cached = profileCache.get(user.id);
  if (cached && (now - cached.timestamp) < AUTH_CACHE_TTL) {
    return cached.data;
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

  const userProfile = profile as User;
  profileCache.set(user.id, { data: userProfile, timestamp: now });
  return userProfile;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export async function isApiContext(): Promise<boolean> {
  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const secFetchDest = h.get('sec-fetch-dest');
    const accept = h.get('accept') || '';
    if (secFetchDest === 'document' || (accept.includes('text/html') && !accept.includes('application/json'))) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function handleApiError(error: any, defaultMessage = 'Internal server error') {
  const statusCode = error?.statusCode || (error?.name === 'AuthError' ? (error.statusCode || 401) : error?.message === 'NEXT_REDIRECT' ? 401 : 500);
  const message = error?.message === 'NEXT_REDIRECT' ? 'Unauthorized: Authentication required' 
    : (error?.name === 'AuthError' ? error.message : (error?.message || defaultMessage));
  return NextResponse.json({ error: message }, { status: statusCode });
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    if (await isApiContext()) {
      throw new AuthError('Unauthorized: Authentication required', 401);
    }
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
    if (await isApiContext()) {
      throw new AuthError('Forbidden: Insufficient role privileges', 403);
    }
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
  const now = Date.now();
  const cached = permissionsCache.get(userId);
  if (cached && (now - cached.timestamp) < AUTH_CACHE_TTL) {
    return cached.data;
  }

  // Fast-path: If profile is cached as admin, return immediately
  const cachedProfile = profileCache.get(userId);
  if (cachedProfile && (now - cachedProfile.timestamp) < AUTH_CACHE_TTL && cachedProfile.data?.role === 'admin') {
    permissionsCache.set(userId, { data: 'ADMIN', timestamp: now });
    return 'ADMIN';
  }

  const supabase = createServiceRoleClient();

  // 1. Get user with role, role_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, role_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    permissionsCache.set(userId, { data: [], timestamp: now });
    return [];
  }
  const user = userData as any;

  // 2. If 'admin', implicit full access
  if (user.role === 'admin') {
    permissionsCache.set(userId, { data: 'ADMIN', timestamp: now });
    return 'ADMIN';
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

    const perms = permissions.map((p: any) => ({
      module: p.modules?.name,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete
    }));
    permissionsCache.set(userId, { data: perms, timestamp: now });
    return perms;
  }

  permissionsCache.set(userId, { data: [], timestamp: now });
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
    // Case-insensitive module name matching
    const modulePerm = permissions.find((p: any) => p.module?.toLowerCase() === moduleName.toLowerCase());
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
    if (await isApiContext()) {
      throw new AuthError(`Forbidden: Insufficient permissions for ${moduleName}`, 403);
    }
    redirect('/unauthorized');
  }

  return session;
}

