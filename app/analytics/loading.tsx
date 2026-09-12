import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  Calendar,
  DollarSign,
  ShoppingBag,
  Receipt,
  Percent,
} from 'lucide-react';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 pb-12">
      {/* Modern Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-card via-card/90 to-muted/30 border border-border/70 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Sales & Financial Intelligence
                </h1>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                  Live Sync
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Executive revenue analytics, margin efficiency, payment tenders, and order throughput
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-9 px-3 rounded-xl border-border/80 text-xs font-semibold gap-1.5 shadow-2xs bg-card"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Refresh</span>
          </Button>

          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 shadow-2xs">
            <div className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-background shadow-xs flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-primary" />
              Smooth Area
            </div>
            <div className="h-7 px-2.5 rounded-lg text-xs font-medium text-muted-foreground flex items-center">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Volume Bar
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid w-full sm:w-[420px] grid-cols-4 h-11 p-1 bg-muted/70 rounded-2xl border border-border/60 shadow-2xs">
            <div className="text-xs font-bold rounded-xl bg-background text-foreground shadow-xs flex items-center justify-center">Today</div>
            <div className="text-xs font-bold rounded-xl text-muted-foreground flex items-center justify-center">7 Days</div>
            <div className="text-xs font-bold rounded-xl text-muted-foreground flex items-center justify-center">30 Days</div>
            <div className="text-xs font-bold rounded-xl text-muted-foreground flex items-center justify-center">Year</div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-card px-3 py-1.5 rounded-xl border border-border/60 shadow-2xs self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border border-border/70 p-5 bg-card/60">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Revenue</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-xl mb-2" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </Card>

          <Card className="rounded-2xl border border-border/70 p-5 bg-card/60">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Orders</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-xl mb-2" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </Card>

          <Card className="rounded-2xl border border-border/70 p-5 bg-card/60">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Ticket</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-xl mb-2" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </Card>

          <Card className="rounded-2xl border border-border/70 p-5 bg-card/60">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Margin</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-xl mb-2" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </Card>
        </div>

        {/* Chart Card Shells */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 rounded-3xl border border-border/70 p-6 bg-card/60">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl mt-4" />
          </Card>

          <Card className="lg:col-span-4 rounded-3xl border border-border/70 p-6 bg-card/60">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl mt-4" />
          </Card>
        </div>
      </div>
    </div>
  );
}
