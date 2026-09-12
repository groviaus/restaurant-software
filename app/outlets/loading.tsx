import { Skeleton } from '@/components/ui/skeleton';
import { Store, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OutletsLoading() {
  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Outlets & Branches
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 min-w-12 inline-flex items-center justify-center">
              <Skeleton className="h-3 w-10" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Multi-outlet architecture: configure physical stores, table plans, and operational contexts
          </p>
        </div>
      </div>

      {/* Outlets List Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border/70 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
