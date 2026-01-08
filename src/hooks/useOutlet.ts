'use client';

import { useOutletStore } from '@/store/outletStore';
import { useAuth } from './useAuth';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useOutlet() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const {
    currentOutletId,
    outlets,
    setCurrentOutlet,
    setOutlets,
    loadOutlets,
    getCurrentOutlet,
  } = useOutletStore();

  // Track if outlets have been loaded to prevent infinite loops
  const outletsLoadedRef = useRef(false);

  // Get effective outlet ID from profile (client-side version)
  // For admins: returns current_outlet_id if set, otherwise outlet_id
  // For non-admins: returns outlet_id
  const effectiveOutletId = profile
    ? profile.role === 'admin'
      ? profile.current_outlet_id || profile.outlet_id || null
      : profile.outlet_id || null
    : null;

  // Sync store with profile's current outlet
  useEffect(() => {
    if (profile && effectiveOutletId) {
      setCurrentOutlet(effectiveOutletId);
    }
  }, [profile, effectiveOutletId, setCurrentOutlet]);

  // Load outlets if admin (only once)
  useEffect(() => {
    if (profile?.role === 'admin' && !outletsLoadedRef.current) {
      // Check current state without subscribing
      const currentState = useOutletStore.getState();
      if (currentState.outlets.length === 0) {
        outletsLoadedRef.current = true;
        currentState.loadOutlets().catch((error) => {
          console.error('Failed to load outlets:', error);
          outletsLoadedRef.current = false; // Reset on error so it can retry
        });
      } else {
        // Outlets already loaded, mark as loaded
        outletsLoadedRef.current = true;
      }
    }
    // Reset ref when user is no longer admin
    if (profile?.role !== 'admin') {
      outletsLoadedRef.current = false;
    }
  }, [profile?.role]);

  const switchOutlet = async (outletId: string) => {
    try {
      const response = await fetch('/api/outlets/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outlet_id: outletId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch outlet');
      }

      const data = await response.json();
      
      // Reload immediately after successful outlet switch
      // The reload will fetch fresh profile and all data from the server
      // No need to update store or refresh profile - reload handles everything
      window.location.reload();
      
      // This return won't execute due to reload, but needed for type safety
      return data;
    } catch (error) {
      console.error('Error switching outlet:', error);
      throw error;
    }
  };

  const refreshOutlets = async () => {
    await loadOutlets();
  };

  return {
    currentOutletId: effectiveOutletId || currentOutletId,
    currentOutlet: getCurrentOutlet(),
    outlets,
    switchOutlet,
    refreshOutlets,
    isAdmin: profile?.role === 'admin',
  };
}

