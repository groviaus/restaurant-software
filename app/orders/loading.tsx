import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Flame, Bell, Receipt, RotateCcw, Search, LayoutGrid, List, SlidersHorizontal, Plus } from 'lucide-react';

export default function OrdersLoading() {
  return (
    <div className="space-y-5">
      {/* Page Header Command Bar - STATIC & INSTANT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Live Orders
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Realtime Connected</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track kitchen flow, prepare dishes, and process table checkout.
          </p>
        </div>

        {/* Global Action Header Button */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center h-8.5 px-2.5 sm:px-3 text-xs font-medium rounded-lg border border-border/60 bg-card/60 text-muted-foreground shadow-2xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span>Sync</span>
          </div>
        </div>
      </div>

      {/* Operational KPI Pipeline Cards - FIXED LABELS & ICONS, SKELETON ONLY ON VALUE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Orders */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Active Orders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-12 rounded my-0.5" />
            <span className="text-[11px] text-muted-foreground">in service</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/40" />
        </div>

        {/* In Kitchen */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Kitchen Queue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-12 rounded my-0.5" />
            <span className="text-[11px] text-muted-foreground">preparing</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/50" />
        </div>

        {/* Ready to Serve */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Ready to Serve</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-12 rounded my-0.5" />
            <span className="text-[11px] text-muted-foreground">pickup ready</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/50" />
        </div>

        {/* Today's Sales Volume */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Today&apos;s Revenue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-20 rounded my-0.5" />
          </div>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500/50" />
        </div>
      </div>

      {/* Control Ribbon Shell - STATIC */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-3 shadow-2xs backdrop-blur-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-background/80 flex items-center text-xs text-muted-foreground">
              Search by order #, table, item name...
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg font-medium bg-background text-foreground shadow-2xs">All</span>
              <span className="px-2.5 py-1 rounded-lg font-medium text-muted-foreground">Dine-In</span>
              <span className="px-2.5 py-1 rounded-lg font-medium text-muted-foreground">Takeaway</span>
            </div>

            <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-background text-foreground shadow-2xs">
                <LayoutGrid className="h-3.5 w-3.5" />
              </div>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground">
                <List className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="h-9 px-3 rounded-xl border border-border/60 bg-background/60 flex items-center text-xs font-medium text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Filters
            </div>

            <div className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground flex items-center text-xs font-semibold shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              New Order
            </div>
          </div>
        </div>

        {/* Pipeline Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 border-t border-border/40">
          {[
            { label: 'Active (Kitchen)', active: true },
            { label: 'All Orders', active: false },
            { label: 'New', active: false },
            { label: 'Preparing', active: false },
            { label: 'Ready', active: false },
            { label: 'Served', active: false },
            { label: 'Completed', active: false },
          ].map((tab) => (
            <div
              key={tab.label}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab.active
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground bg-transparent'
              }`}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Grid Skeleton - Targeted placeholders inside ticket cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2 py-2">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-4/5 rounded" />
              <Skeleton className="h-3.5 w-2/3 rounded" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-8.5 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
