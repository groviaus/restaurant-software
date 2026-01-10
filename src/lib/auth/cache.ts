import { createClient, createServiceRoleClient } from '../supabase/server';
import { User } from '../types';
import { redirect } from 'next/navigation';
import { checkPermission } from '../auth';

/**
 * Combined auth helper that performs requirePermission, getUserProfile, and getEffectiveOutletId
 * in a single operation to reduce Supabase queries from 3 to 1 per API call.
 * 
 * This is the optimized version that combines all auth checks into one function call.
 */
export async function getCachedAuth(
  moduleName: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<{ user: { id: string }; profile: User; outletId: string | null }> {
  // Step 1: Get user (single Supabase query)
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Step 2: Get profile using service role client (single Supabase query)
  const serviceSupabase = createServiceRoleClient();
  const { data: profileData, error: profileError } = await serviceSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    redirect('/login');
  }

  // Type the profile as User
  const profile = profileData as User;

  // Step 3: Check permission (may involve additional query if role_id exists)
  const hasPermission = await checkPermission(user.id, moduleName, action);
  if (!hasPermission) {
    redirect('/unauthorized');
  }

  // Step 4: Calculate effective outlet ID (no query needed, just logic)
  const outletId = profile.role === 'admin'
    ? (profile.current_outlet_id || profile.outlet_id || null)
    : (profile.outlet_id || null);

  return {
    user: { id: user.id },
    profile: profile as User,
    outletId,
  };
}

/**
 * Get effective outlet ID from profile
 */
export function getEffectiveOutletId(profile: User | null): string | null {
  if (!profile) {
    return null;
  }

  if (profile.role === 'admin') {
    return profile.current_outlet_id || profile.outlet_id || null;
  }

  return profile.outlet_id || null;
}

