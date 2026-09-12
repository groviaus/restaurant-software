import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, CheckCircle2, Users, Receipt, RefreshCw, Search, Plus } from 'lucide-react';

export default function TablesLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page Header Command Bar - STATIC */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Tables & Floor
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            ...
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Sync Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Floor</span>
          </div>

          <div className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border/70 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </div>
        </div>
      </div>

      {/* 1. Floor Analytics Strip - STATIC LABELS & ICONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Floor Tables */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Floor Tables
            </span>
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Utensils className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium">
            Loading seating...
          </p>
        </div>

        {/* Available */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium">
            Ready for walk-in guests
          </p>
        </div>

        {/* Occupied */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Occupied
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium">
            Live occupancy
          </p>
        </div>

        {/* Floor Bills */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Floor Bills
            </span>
            <div className="h-7 w-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium">
            Active table bills
          </p>
        </div>
      </div>

      {/* 2. Control Ribbon - STATIC */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <div className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border border-border/60 bg-background/80 flex items-center text-muted-foreground">
              Search by table name or capacity...
            </div>
          </div>

          {/* Quick capacity filter pills */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs">
            <span className="h-7.5 px-2.5 rounded-lg font-semibold bg-card text-foreground shadow-xs flex items-center">All</span>
            <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">2 Seats</span>
            <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">4 Seats</span>
            <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">6+ Seats</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs">
            <span className="h-7.5 px-2.5 rounded-lg font-semibold bg-card text-foreground shadow-xs flex items-center">All</span>
            <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">Available</span>
            <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">Occupied</span>
          </div>

          {/* Add Table Button */}
          <div className="h-8.5 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground flex items-center gap-1.5 shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Table</span>
          </div>
        </div>
      </div>

      {/* 3. Floor Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card border border-border/60 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28 rounded" />
            <div className="pt-2 border-t border-border/40 flex justify-between items-center">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
