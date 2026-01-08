'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout constant for profile fetches (10 seconds)
const PROFILE_FETCH_TIMEOUT = 10000;
// Maximum time for entire auth initialization (15 seconds)
const AUTH_INIT_MAX_TIMEOUT = 15000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();
    const isFetchingProfileRef = useRef(false);
    const mountedRef = useRef(true);
    const currentUserIdRef = useRef<string | null>(null);
    const currentProfileUserIdRef = useRef<string | null>(null);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        mountedRef.current = true;

        // Safety timeout - ensure loading is always set to false after max time
        initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && loading) {
                console.warn('Auth initialization timeout - forcing loading to false');
                setLoading(false);
            }
        }, AUTH_INIT_MAX_TIMEOUT);

        async function initializeAuth() {
            try {
                // Check if outlet switch just happened - if so, force profile refresh
                const outletSwitchFlag = typeof window !== 'undefined' 
                    ? sessionStorage.getItem('outlet_switch_in_progress')
                    : null;
                
                if (outletSwitchFlag === 'true' && typeof window !== 'undefined') {
                    // Clear the flag
                    sessionStorage.removeItem('outlet_switch_in_progress');
                }

                // Use getUser() instead of getSession() to validate with server
                // Add timeout to prevent hanging on corrupted sessions
                let authUser, userError;
                try {
                    const getUserPromise = supabase.auth.getUser();
                    const getUserTimeout = new Promise<{ data: { user: null }, error: { message: string } }>((resolve) => {
                        setTimeout(() => resolve({ 
                            data: { user: null }, 
                            error: { message: 'Session validation timeout' } as any 
                        }), 5000);
                    });
                    
                    const result = await Promise.race([getUserPromise, getUserTimeout]);
                    authUser = result.data?.user;
                    userError = result.error;
                    
                    if (userError?.message === 'Session validation timeout') {
                        console.warn('getUser() timed out - likely corrupted session, clearing auth');
                    }
                } catch (error: any) {
                    console.error('Error in getUser():', error);
                    userError = error;
                    authUser = null;
                }
                
                if (!mountedRef.current) return;

                if (userError || !authUser) {
                    // Invalid or no session - clear state and stop loading
                    // If it's a timeout, also clear the corrupted session
                    if (userError?.message === 'Session validation timeout') {
                        console.warn('Clearing corrupted session due to timeout');
                        try {
                            await supabase.auth.signOut();
                        } catch (signOutError) {
                            console.error('Error signing out corrupted session:', signOutError);
                        }
                    }
                    
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                    if (initTimeoutRef.current) {
                        clearTimeout(initTimeoutRef.current);
                        initTimeoutRef.current = null;
                    }
                    // Redirect to login if we're not already there
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        router.push('/login');
                    }
                    return;
                }

                currentUserIdRef.current = authUser.id;
                setUser(authUser);
                
                // If outlet switch happened, force a fresh profile fetch (bypass cache)
                if (outletSwitchFlag === 'true') {
                    // Reset profile ref to force fetch
                    currentProfileUserIdRef.current = null;
                }
                
                await fetchUserProfile(authUser.id);
                
                // Clear safety timeout on success
                if (initTimeoutRef.current) {
                    clearTimeout(initTimeoutRef.current);
                    initTimeoutRef.current = null;
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mountedRef.current) {
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                }
                if (initTimeoutRef.current) {
                    clearTimeout(initTimeoutRef.current);
                    initTimeoutRef.current = null;
                }
            }
        }

        initializeAuth();

        return () => {
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mountedRef.current) return;

            // Handle sign out events immediately
            if (event === 'SIGNED_OUT' || !session?.user) {
                setUser(null);
                setProfile(null);
                currentUserIdRef.current = null;
                currentProfileUserIdRef.current = null;
                setLoading(false);
                return;
            }

            // Validate session with server before proceeding
            try {
                const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
                
                if (!mountedRef.current) return;

                if (userError || !authUser) {
                    // Session is invalid - clear state
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                    return;
                }

                // Only update if user changed or we don't have a profile for this user yet
                const userIdChanged = authUser.id !== currentUserIdRef.current;
                const profileMissing = currentProfileUserIdRef.current !== authUser.id;
                
                if (userIdChanged || profileMissing) {
                    currentUserIdRef.current = authUser.id;
                    setUser(authUser);
                    await fetchUserProfile(authUser.id);
                }
            } catch (error) {
                console.error('Error validating session in auth state change:', error);
                if (mountedRef.current) {
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                }
            }
        });

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }
        };
    }, []);

    async function fetchUserProfile(userId: string) {
        // Prevent multiple simultaneous profile fetches
        if (isFetchingProfileRef.current) {
            return;
        }

        isFetchingProfileRef.current = true;

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT);
            });

            // Race between profile fetch and timeout
            const profilePromise = supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

            if (!mountedRef.current) return;

            if (error) {
                console.error('Error fetching profile:', error);
                
                // Validate session when profile fetch fails
                try {
                    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
                    
                    if (userError || !authUser || authUser.id !== userId) {
                        // Session is invalid or user changed - clear state and redirect
                        console.warn('Session validation failed after profile fetch error');
                        setUser(null);
                        setProfile(null);
                        currentUserIdRef.current = null;
                        currentProfileUserIdRef.current = null;
                        setLoading(false);
                        router.push('/login');
                        return;
                    }
                    
                    // Session is valid but profile fetch failed (RLS or other issue)
                    // Allow navigation but profile will be null
                    currentProfileUserIdRef.current = null;
                    setProfile(null);
                    // Explicitly set loading to false here to ensure it resolves
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                } catch (validationError) {
                    console.error('Error validating session after profile fetch failure:', validationError);
                    // If validation also fails, clear everything
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                    router.push('/login');
                    return;
                }
            } else {
                currentProfileUserIdRef.current = userId;
                setProfile(data as UserProfile);
            }
        } catch (error: any) {
            console.error('Error in fetchUserProfile:', error);
            
            if (!mountedRef.current) return;

            // Handle timeout or other errors
            if (error?.message === 'Profile fetch timeout') {
                console.warn('Profile fetch timed out, validating session...');
                
                // Validate session on timeout
                try {
                    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
                    
                    if (userError || !authUser || authUser.id !== userId) {
                        setUser(null);
                        setProfile(null);
                        currentUserIdRef.current = null;
                        currentProfileUserIdRef.current = null;
                        setLoading(false);
                        router.push('/login');
                        return;
                    }
                    
                    // Session valid but fetch timed out - allow navigation
                    currentProfileUserIdRef.current = null;
                    setProfile(null);
                    // Explicitly set loading to false here to ensure it resolves
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                } catch (validationError) {
                    console.error('Error validating session after timeout:', validationError);
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                    router.push('/login');
                    return;
                }
            } else {
                // Other errors - validate session
                try {
                    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
                    
                    if (userError || !authUser || authUser.id !== userId) {
                        setUser(null);
                        setProfile(null);
                        currentUserIdRef.current = null;
                        currentProfileUserIdRef.current = null;
                        setLoading(false);
                        router.push('/login');
                        return;
                    }
                    
                    currentProfileUserIdRef.current = null;
                    setProfile(null);
                    // Explicitly set loading to false here to ensure it resolves
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                } catch (validationError) {
                    setUser(null);
                    setProfile(null);
                    currentUserIdRef.current = null;
                    currentProfileUserIdRef.current = null;
                    setLoading(false);
                    router.push('/login');
                    return;
                }
            }
        } finally {
            // Always ensure loading is false and flag is reset
            if (mountedRef.current) {
                setLoading(false);
            }
            isFetchingProfileRef.current = false;
        }
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.id);
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setUser(null);
            setProfile(null);
            currentUserIdRef.current = null;
            currentProfileUserIdRef.current = null;
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
