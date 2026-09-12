import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  FolderTree,
  UtensilsCrossed,
  CheckCircle2,
  ListOrdered,
  RefreshCw,
  Plus,
  LayoutGrid,
  List,
} from 'lucide-react';

export default function CategoriesLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Menu Categories
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground min-w-6 inline-flex items-center justify-center">
              <Skeleton className="h-3 w-5" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Organize menu items, customize digital menu sections, and set display order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Active Menu</span>
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

          <Button
            size="sm"
            disabled
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground opacity-80 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Categories */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Categories
            </span>
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FolderTree className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Menu sections active
          </p>
        </div>

        {/* Total Menu Items */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Dishes
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UtensilsCrossed className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-14 my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Assigned to categories
          </p>
        </div>

        {/* Populated Coverage */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu Coverage
            </span>
            <div className="h-7 w-7 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            calculating...
          </p>
        </div>

        {/* Display Sequence Order */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Display Sequence
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ListOrdered className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Priority ordering sequence
          </p>
        </div>
      </div>

      {/* 3. Control Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <Skeleton className="h-8.5 w-full sm:max-w-xs rounded-xl" />
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
            <div className="h-7.5 px-3 rounded-lg text-xs flex items-center gap-1.5 bg-card text-foreground shadow-xs font-semibold">
              <span>All</span>
            </div>
            <div className="h-7.5 px-3 rounded-lg text-xs flex items-center gap-1.5 text-muted-foreground">
              <span>With Items</span>
            </div>
            <div className="h-7.5 px-3 rounded-lg text-xs flex items-center gap-1.5 text-muted-foreground">
              <span>Empty</span>
            </div>
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

      {/* 5. Mobile-First Card Grid Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-md" />
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
