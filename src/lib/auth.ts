import { createClient, createServiceRoleClient } from './supabase/server';
import { UserRole } from './types';
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

export async function getUserProfile() {
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

  return profile;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
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

  return allowedRoles.includes(profile.role as UserRole);
}

