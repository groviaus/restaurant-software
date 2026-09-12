import { User } from '../types';
import { redirect } from 'next/navigation';
import { checkPermission, getUserProfile } from '../auth';

/**
 * Combined auth helper that performs requirePermission, getUserProfile, and getEffectiveOutletId
 * in a single operation to reduce Supabase queries from 3 to 1 per API call.
 * 
 * This is the optimized version that combines all auth checks into one function call
 * and utilizes the Promise-based deduplication cache.
 */
export async function getCachedAuth(
  moduleName: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<{ user: { id: string }; profile: User; outletId: string | null }> {
  
  // Step 1 & 2: Get profile (uses deduplicated cache + getUser inside)
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Step 3: Check permission (uses deduplicated cache)
  const hasPermission = await checkPermission(profile.id, moduleName, action);
  if (!hasPermission) {
    redirect('/unauthorized');
  }

  // Step 4: Calculate effective outlet ID (no query needed, just logic)
  const outletId = profile.role === 'admin'
    ? (profile.current_outlet_id || profile.outlet_id || null)
    : (profile.outlet_id || null);

  return {
    user: { id: profile.id },
    profile,
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

