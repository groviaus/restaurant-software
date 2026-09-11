'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  Loader2,
  Calendar,
  Users,
  Building2,
  UtensilsCrossed,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { downloadFile } from '@/lib/capacitor/download';

export default function ReportsPage() {
  const router = useRouter();
  const { checkPermission, loading: permLoading } = usePermissions();

  const getTodayIST = () => {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffsetMs);
    const year = nowIST.getUTCFullYear();
    const month = String(nowIST.getUTCMonth() + 1).padStart(2, '0');
    const day = String(nowIST.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayIST());
  const [startDate, setStartDate] = useState(getTodayIST());
  const [endDate, setEndDate] = useState(getTodayIST());
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!permLoading && !checkPermission('reports', 'view')) {
      router.push('/dashboard');
    }
  }, [permLoading, checkPermission, router]);

  if (permLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  const downloadReport = async (type: string, params: Record<string, string>) => {
    setLoading(type);
    try {
      const queryParams = new URLSearchParams({ ...params, format: 'csv' });
      const response = await fetch(`/api/reports/${type}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const filename =
        response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        `${type}-report.csv`;
      const contentType = response.headers.get('content-type') || 'text/csv';

      await downloadFile(blob, filename, contentType);
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download report');
    } finally {
      setLoading(null);
    }
  };

  const handleQuickPreset = (daysAgo: number) => {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffsetMs);

    const pastDate = new Date(nowIST);
    pastDate.setDate(nowIST.getDate() - daysAgo);

    const formatD = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setStartDate(formatD(pastDate));
    setEndDate(formatD(nowIST));
    toast.info(`Preset applied: Last ${daysAgo === 0 ? 'Today' : `${daysAgo} Days`}`);
  };

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
          <button
            type="button"
            onClick={() => handleQuickPreset(0)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(7)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer"
          >
            7D
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(30)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer"
          >
            30D
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* 1. Daily Sales Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
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
                <Label htmlFor="daily-date" className="text-xs font-semibold text-foreground/90">
                  Select Target Date
                </Label>
                <Input
                  id="daily-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-background text-xs sm:text-sm font-mono"
                />
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button
              onClick={() => downloadReport('daily', { date })}
              disabled={loading === 'daily'}
              className="w-full h-9 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              {loading === 'daily' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Daily Ledger (CSV)
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 2. Item-wise Sales Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Item-wise Product Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Total units ordered, gross revenue contribution, and menu item ranking
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="itemwise-start" className="text-xs font-semibold text-foreground/90">
                    From Date
                  </Label>
                  <Input
                    id="itemwise-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-background text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="itemwise-end" className="text-xs font-semibold text-foreground/90">
                    To Date
                  </Label>
                  <Input
                    id="itemwise-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button
              onClick={() => downloadReport('itemwise', { startDate, endDate })}
              disabled={loading === 'itemwise'}
              className="w-full h-9 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              {loading === 'itemwise' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Product Report (CSV)
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 3. Staff Performance Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Staff & Waiter Productivity
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Order throughput, billing volume, and ticket averages generated per staff member
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-start" className="text-xs font-semibold text-foreground/90">
                    From Date
                  </Label>
                  <Input
                    id="staff-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-background text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-end" className="text-xs font-semibold text-foreground/90">
                    To Date
                  </Label>
                  <Input
                    id="staff-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button
              onClick={() => downloadReport('staff', { startDate, endDate })}
              disabled={loading === 'staff'}
              className="w-full h-9 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              {loading === 'staff' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Staff Productivity (CSV)
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 4. Outlet-wise Comparative Report */}
        <Card className="rounded-2xl border border-border/70 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <CardHeader className="p-5 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Multi-Outlet Comparison
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Compare gross sales and transaction volume across all restaurant outlets
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="outlet-start" className="text-xs font-semibold text-foreground/90">
                    From Date
                  </Label>
                  <Input
                    id="outlet-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-background text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="outlet-end" className="text-xs font-semibold text-foreground/90">
                    To Date
                  </Label>
                  <Input
                    id="outlet-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="p-5 pt-0">
            <Button
              onClick={() => downloadReport('outletwise', { startDate, endDate })}
              disabled={loading === 'outletwise'}
              className="w-full h-9 rounded-xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              {loading === 'outletwise' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Branch Comparison (CSV)
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
