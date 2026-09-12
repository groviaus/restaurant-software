import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, CheckCircle2, FolderTree, IndianRupee, RefreshCw, Plus, Search, LayoutGrid, List } from 'lucide-react';

export default function MenuLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header Command Bar - STATIC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Menu Management
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              ...
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage restaurant menu items, pricing structures, portions, and live POS stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Catalog Live</span>
          </div>

          {/* Sync */}
          <div className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-border/70 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </div>

          {/* Add Menu Item */}
          <div className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-xs flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Menu Item</span>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Strip - STATIC LABELS & ICONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Dishes */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Dishes
            </span>
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UtensilsCrossed className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Catalog items active
          </p>
        </div>

        {/* Available in Stock */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available in Stock
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Ready to order
          </p>
        </div>

        {/* Categories Covered */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categories
            </span>
            <div className="h-7 w-7 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <FolderTree className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Menu categories
          </p>
        </div>

        {/* Average Dish Price */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Price
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 rounded my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Average dish price
          </p>
        </div>
      </div>

      {/* 3. Control Ribbon - STATIC */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <div className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border border-border/60 bg-background/80 flex items-center text-muted-foreground">
                Search dishes, ingredients...
              </div>
            </div>
            <div className="h-8.5 w-[140px] px-3 rounded-xl border border-border/60 bg-background/80 text-xs flex items-center text-muted-foreground">
              All Categories
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs">
              <span className="h-7.5 px-2.5 rounded-lg font-semibold bg-card text-foreground shadow-xs flex items-center">All</span>
              <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">Available</span>
              <span className="h-7.5 px-2.5 rounded-lg text-muted-foreground flex items-center">86&apos;d / Off</span>
            </div>

            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              <div className="h-7.5 w-7.5 rounded-lg flex items-center justify-center bg-card text-foreground shadow-xs">
                <LayoutGrid className="h-3.5 w-3.5" />
              </div>
              <div className="h-7.5 w-7.5 rounded-lg flex items-center justify-center text-muted-foreground">
                <List className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-between items-center">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
