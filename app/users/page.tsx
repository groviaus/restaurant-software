'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { UsersTable } from '@/components/users/UsersTable';
import { UserForm } from '@/components/users/UserForm';
import { Loader2, Users, Shield, UserCheck, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// In-memory cache across navigations
let usersMemoryCache: User[] | null = null;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(() => usersMemoryCache || []);
  const [loading, setLoading] = useState(() => !usersMemoryCache);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    if (!usersMemoryCache) setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        usersMemoryCache = data;
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

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const staffCount = users.length - adminCount;

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Users & Staff
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Access Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage cashier logins, waiter accounts, managerial roles, and outlet assignments
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <UserForm onSuccess={fetchUsers} />
        </div>
      </div>

      {/* Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Total Accounts</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {loading && users.length === 0 ? <Skeleton className="h-7 w-12 my-0.5" /> : users.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>Administrators</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {loading && users.length === 0 ? <Skeleton className="h-7 w-10 my-0.5" /> : adminCount}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Floor & Kitchen Staff</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {loading && users.length === 0 ? <Skeleton className="h-7 w-10 my-0.5" /> : staffCount}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border/70 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff name, email, or role..."
            className="pl-9 h-9 border-0 bg-transparent focus-visible:ring-0 text-xs sm:text-sm"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Users Table */}
      {loading && users.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-7 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <UsersTable users={filteredUsers} onRefresh={fetchUsers} />
      )}
    </div>
  );
}
