'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { UsersTable } from '@/components/users/UsersTable';
import { UserForm } from '@/components/users/UserForm';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-8 pt-3 sm:pt-4 lg:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Users Management</h2>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        Manage user accounts and assign roles.
                    </p>
                </div>
                <div className="flex items-center">
                    <UserForm onSuccess={fetchUsers} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <UsersTable users={users} onRefresh={fetchUsers} />
            )}
        </div>
    );
}
