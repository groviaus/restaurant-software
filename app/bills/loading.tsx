import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, CreditCard, Banknote, TrendingUp, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillsLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Bills & Invoices
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground min-w-6 inline-flex items-center justify-center">
              <Skeleton className="h-3 w-5" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            View, audit, reprint thermal receipts, and reconcile payment collections.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Invoices</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 border-border/70"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards Shell */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Total Billed</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <Skeleton className="h-6 sm:h-7 w-24 my-0.5" />
          <p className="text-[11px] text-muted-foreground">in filtered window</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Digital Pay</span>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <Skeleton className="h-6 sm:h-7 w-20 my-0.5" />
          <p className="text-[11px] text-muted-foreground">online / card settlements</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Cash Settled</span>
            <Banknote className="h-4 w-4 text-amber-500" />
          </div>
          <Skeleton className="h-6 sm:h-7 w-20 my-0.5" />
          <p className="text-[11px] text-muted-foreground">counter cash receipts</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Avg Ticket</span>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <Skeleton className="h-6 sm:h-7 w-16 my-0.5" />
          <p className="text-[11px] text-muted-foreground">per completed bill</p>
        </div>
      </div>

      {/* Control Bar Shell */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <Skeleton className="h-9 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
            <div className="p-1.5 rounded-lg bg-card text-foreground shadow-2xs">
              <LayoutGrid className="h-3.5 w-3.5" />
            </div>
            <div className="p-1.5 rounded-lg text-muted-foreground">
              <List className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Cards Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
