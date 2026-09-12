'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Clock } from 'lucide-react';

interface HourData {
  hour: string;
  orders: number;
}

interface PeakHourPayloadItem {
  payload: {
    hour: string;
  };
  value: number;
}

interface PeakHoursTooltipProps {
  active?: boolean;
  payload?: PeakHourPayloadItem[];
}

function PeakHoursTooltip({ active, payload }: PeakHoursTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <Clock className="h-3 w-3" />
          <span>Time Window: {payload[0].payload.hour}</span>
        </div>
        <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
          {payload[0].value} Orders
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Total 30-day traffic
        </div>
      </div>
    );
  }
  return null;
}

export function PeakHoursChart() {
  const [data, setData] = useState<HourData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/peak-hours?days=30')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((result) => {
        const rawData = result.data || [];

        // Group into 2-hour intervals for better visualization
        const grouped: Record<string, number> = {};
        rawData.forEach((item: HourData) => {
          const hour = parseInt(item.hour.split(':')[0]);
          const intervalStart = Math.floor(hour / 2) * 2;
          const intervalEnd = intervalStart + 2;
          const intervalKey = `${intervalStart}-${intervalEnd}`;
          grouped[intervalKey] = (grouped[intervalKey] || 0) + item.orders;
        });

        // Convert to array and sort by interval start time
        const chartData = Object.entries(grouped)
          .map(([hour, orders]) => ({
            hour: `${hour}:00`,
            orders: Number(orders) || 0,
            intervalStart: parseInt(hour.split('-')[0]),
          }))
          .sort((a, b) => a.intervalStart - b.intervalStart)
          .map((item) => ({ hour: item.hour, orders: item.orders }));

        setData(chartData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching peak hours:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-3 w-36 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-[220px] sm:h-[280px] flex items-end gap-2 p-2 mt-auto">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-muted/50 rounded-t animate-pulse"
              style={{ height: `${(i % 5 + 1) * 18}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-md flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
              Peak Hours
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-3 w-3" />
              30 Days
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hourly order concentration
          </p>
        </div>
      </div>

      {/* Chart - Anchored to bottom of card */}
      <div className="h-[220px] sm:h-[280px] w-full mt-auto">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No order distribution data recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -15,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.65} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-border/40"
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
              />
              <YAxis
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                allowDecimals={false}
              />
              <Tooltip content={<PeakHoursTooltip />} />
              <Bar
                dataKey="orders"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                name="Orders"
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}


