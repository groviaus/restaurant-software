import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Lock, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RolesLoading() {
  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Roles & Security
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              RBAC Matrix
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure system roles, access policies, and granular module permissions (view, create, edit, delete)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            disabled
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground opacity-80 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Role</span>
          </Button>
        </div>
      </div>

      {/* Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Configured Roles</span>
          </div>
          <Skeleton className="h-7 w-12 my-0.5" />
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>RBAC Protected Modules</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            12 Modules
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Enforcement Engine</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-1">
            Active & Enforced
          </p>
        </div>
      </div>

      {/* Roles Table Skeletons */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
