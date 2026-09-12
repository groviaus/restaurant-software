import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, FileSpreadsheet, UtensilsCrossed, Users, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Executive Reports & Exports
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              CSV Export
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Generate and export consolidated sales figures, product movements, and staff performance records
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 self-start sm:self-auto">
          <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground">Today</div>
          <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground">7D</div>
          <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground">30D</div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* 1. Daily Sales Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Daily Sales & Tax Ledger
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Day-by-day transactional audit including payment types, subtotal, and tax
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button disabled className="w-full h-10 rounded-xl text-xs font-semibold gap-2 opacity-80">
              <Download className="w-4 h-4" />
              Export Daily Sales CSV
            </Button>
          </div>
        </Card>

        {/* 2. Range Sales Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Range-Based Financial Journal
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Aggregate revenue breakdown over a custom multi-day fiscal window
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button disabled className="w-full h-10 rounded-xl text-xs font-semibold gap-2 opacity-80">
              <Download className="w-4 h-4" />
              Export Range Journal CSV
            </Button>
          </div>
        </Card>

        {/* 3. Item Sales Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Product & Dish Velocity
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Item-level volume, gross contributions, and ranking by popularity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button disabled className="w-full h-10 rounded-xl text-xs font-semibold gap-2 opacity-80">
              <Download className="w-4 h-4" />
              Export Item Sales CSV
            </Button>
          </div>
        </Card>

        {/* 4. Staff Performance Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Waiter & Staff Productivity
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Order volume, bill creation, and payment collection grouped by team member
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button disabled className="w-full h-10 rounded-xl text-xs font-semibold gap-2 opacity-80">
              <Download className="w-4 h-4" />
              Export Staff Report CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
