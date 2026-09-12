'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

export function AuthProvider({ 
    children, 
    initialUser, 
    initialProfile 
}: { 
    children: React.ReactNode, 
    initialUser: User | null, 
    initialProfile: UserProfile | null 
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
    const [loading, setLoading] = useState(false); // Initially false because we have the server-side state
    const router = useRouter();
    const supabase = createClient();

    // Only update state if the initial props change from the server
    useEffect(() => {
        setUser(initialUser);
        setProfile(initialProfile);
    }, [initialUser, initialProfile]);

    useEffect(() => {
        // We only use onAuthStateChange to handle events like sign out from another tab
        // or to trigger a hard refresh when a login completes client-side.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // For token refreshes, we don't need to do anything as the cookie is handled
            // by middleware and the client automatically updates its headers.
            if (event === 'TOKEN_REFRESHED') return;
            if (event === 'INITIAL_SESSION') return;

            // Handle sign out events
            if (event === 'SIGNED_OUT' || !session?.user) {
                window.location.href = '/login';
                return;
            }

            // On sign in, tell Next.js to re-fetch the Server Components so that
            // layout.tsx gets the new user and passes it down.
            if (event === 'SIGNED_IN') {
                router.refresh();
                router.push('/');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase.auth]);

    const refreshProfile = async () => {
        // Triggering a router refresh forces the server to re-fetch the profile and pass it down
        router.refresh();
    };

    const signOut = async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error signing out:', error);
            setLoading(false);
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
