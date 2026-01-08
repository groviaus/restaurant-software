'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
            <div className="mx-auto flex max-w-[400px] flex-col items-center justify-center space-y-6 text-center">
                <div className="rounded-full bg-red-100 p-6">
                    <div className="h-10 w-10 text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-gray-500">
                        You do not have permission to view this page. Please contact your administrator.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        Go Back
                    </Button>
                    <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
