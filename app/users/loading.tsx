import { Skeleton } from '@/components/ui/skeleton';
import { Users, Shield, UserCheck, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersLoading() {
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
          <Button
            size="sm"
            disabled
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground opacity-80 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </Button>
        </div>
      </div>

      {/* Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Total Accounts</span>
          </div>
          <Skeleton className="h-7 w-12 my-0.5" />
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>Administrators</span>
          </div>
          <Skeleton className="h-7 w-10 my-0.5" />
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Floor & Kitchen Staff</span>
          </div>
          <Skeleton className="h-7 w-10 my-0.5" />
        </div>
      </div>

      {/* Filter / Search Bar Shell */}
      <div className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border/70 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>

      {/* Users Table Skeletons */}
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
    </div>
  );
}
