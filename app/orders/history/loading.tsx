import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';

export default function OrderHistoryLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Live Sync Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Order History
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground min-w-6 inline-flex items-center justify-center">
            <Skeleton className="h-3 w-5" />
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Sync Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Sync</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 border-border/70"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <div className="h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 bg-card text-foreground shadow-xs font-semibold">
              <List className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Table</span>
            </div>
            <div className="h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Cards</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Sales
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 my-0.5" />
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            bills settled
          </p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 my-0.5" />
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            settled orders
          </p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cancelled
            </span>
            <div className="h-7 w-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-10 my-0.5" />
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            Voided or cancelled
          </p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Ticket
            </span>
            <div className="h-7 w-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 my-0.5" />
          <p className="text-[11px] text-muted-foreground truncate font-medium">
            Average spend per order
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar Shell */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-card/60 p-2.5 sm:p-3 rounded-2xl border border-border/60">
        <Skeleton className="h-8.5 w-full md:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8.5 w-24 rounded-xl" />
          <Skeleton className="h-8.5 w-24 rounded-xl" />
        </div>
      </div>

      {/* 4. Table Shell */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-18 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
