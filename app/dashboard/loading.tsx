import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingCart, UtensilsCrossed, Package, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { QuickActionsDesktop } from '@/components/dashboard/QuickActionsDesktop';

export default function DashboardLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop Quick Actions - STATIC & INSTANT */}
      <QuickActionsDesktop />

      {/* Header - STATIC & INSTANT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-0">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live Ops</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Overview of today&apos;s orders, sales revenue, and inventory status
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/60 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Today</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card text-xs font-medium text-muted-foreground shadow-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </div>
        </div>
      </div>

      {/* Metric Cards - STATIC LABELS & ICONS, SKELETON ONLY ON VALUE */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 px-1 sm:px-0">
        {/* Today's Sales */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Today&apos;s Sales</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-20 rounded my-0.5" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Live billed sales</p>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40" />
        </div>

        {/* Today's Orders */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Today&apos;s Orders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-12 rounded my-0.5" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Total orders placed</p>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/40" />
        </div>

        {/* Top Item */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Top Item</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UtensilsCrossed className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-24 rounded my-0.5" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Best seller today</p>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/40" />
        </div>

        {/* Inventory Items */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Inventory Items</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-12 rounded my-0.5" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Total tracked SKUs</p>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-500/40" />
        </div>

        {/* Low Stock Alerts */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Low Stock Alerts</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-7 w-12 rounded my-0.5" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Stock status</p>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500/40" />
        </div>
      </div>

      {/* Active Orders Strip Skeleton */}
      <div className="h-28 w-full rounded-2xl border border-border/60 bg-card/60 p-5 px-1 sm:px-0 flex items-center justify-center">
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-1 sm:px-0">
        <div className="h-[290px] rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">Sales Velocity</div>
            <div className="text-xs text-muted-foreground">Hourly sales revenue and order frequency</div>
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="h-[290px] rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">Payment Settlement Mix</div>
            <div className="text-xs text-muted-foreground">Split across Cash, UPI, and Cards</div>
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
