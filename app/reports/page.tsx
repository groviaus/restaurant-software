'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { downloadFile } from '@/lib/capacitor/download';

export default function ReportsPage() {
  const router = useRouter();
  const { checkPermission, loading: permLoading } = usePermissions();
  // Get today's date in IST timezone to match dashboard and analytics
  const getTodayIST = () => {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
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
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${type}-report.csv`;
      const contentType = response.headers.get('content-type') || 'text/csv';
      
      await downloadFile(blob, filename, contentType);
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export sales reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daily Sales Report
            </CardTitle>
            <CardDescription>Generate daily sales report for a specific date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="daily-date">Date</Label>
              <Input
                id="daily-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => downloadReport('daily', { date })}
              disabled={loading === 'daily'}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading === 'daily' ? 'Generating...' : 'Download CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Item-wise Sales Report
            </CardTitle>
            <CardDescription>Sales breakdown by menu items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemwise-start">Start Date</Label>
                <Input
                  id="itemwise-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="itemwise-end">End Date</Label>
                <Input
                  id="itemwise-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={() => downloadReport('itemwise', { startDate, endDate })}
              disabled={loading === 'itemwise'}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading === 'itemwise' ? 'Generating...' : 'Download CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Staff Performance Report
            </CardTitle>
            <CardDescription>Sales performance by staff members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staff-start">Start Date</Label>
                <Input
                  id="staff-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staff-end">End Date</Label>
                <Input
                  id="staff-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={() => downloadReport('staff', { startDate, endDate })}
              disabled={loading === 'staff'}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading === 'staff' ? 'Generating...' : 'Download CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Outlet-wise Sales Report
            </CardTitle>
            <CardDescription>Compare sales across all outlets (Admin only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outlet-start">Start Date</Label>
                <Input
                  id="outlet-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="outlet-end">End Date</Label>
                <Input
                  id="outlet-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={() => downloadReport('outletwise', { startDate, endDate })}
              disabled={loading === 'outletwise'}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading === 'outletwise' ? 'Generating...' : 'Download CSV'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

