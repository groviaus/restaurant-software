import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Boxes,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  ClipboardCheck,
  Trash2,
  Plus,
  RotateCcw,
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  ShoppingCart,
} from 'lucide-react';

export default function InventoryLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Inventory & Stock
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Ledger Active</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Single source of truth for stock availability, BOM recipes, and purchase receiving.
          </p>
        </div>

        {/* Global Action Button Cluster */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8.5 px-3 text-xs font-medium rounded-xl border-border/60 bg-card/60 shadow-2xs gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock Count</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8.5 px-3 text-xs font-medium rounded-xl border-border/60 bg-card/60 shadow-2xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Wastage</span>
          </Button>

          <Button
            size="sm"
            disabled
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground opacity-80 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8.5 w-8.5 p-0 rounded-xl border-border/60 bg-card/60 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
          </Button>
        </div>
      </div>

      {/* 2. Segmented Navigation Ribbon */}
      <div className="flex items-center overflow-x-auto pb-1 no-scrollbar">
        <div className="bg-muted/60 p-1 rounded-2xl border border-border/60 inline-flex gap-1">
          <div className="rounded-xl px-3.5 py-1.5 text-xs font-semibold bg-card text-foreground shadow-xs flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </div>
          <div className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5" />
            <span>Items Master</span>
          </div>
          <div className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Ledger Logs</span>
          </div>
          <div className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Recipes / BOM</span>
          </div>
          <div className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Purchases & POs</span>
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Items
            </span>
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-12 my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Ingredients & packaging tracked
          </p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Stock Valuation
            </span>
            <div className="h-7 w-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 my-0.5" />
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Total on-hand asset value
          </p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-10 my-0.5" />
          <p className="text-[11px] text-amber-600/80 font-medium truncate">
            Under minimum threshold
          </p>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="h-7 w-7 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <Skeleton className="h-7 w-10 my-0.5" />
          <p className="text-[11px] text-rose-600/80 font-medium truncate">
            Disables linked dishes in POS
          </p>
        </div>
      </div>

      {/* 4. Operational Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-7 bg-card rounded-2xl border border-border/70 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-card rounded-2xl border border-border/70 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
