'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface SalesData {
  date: string;
  sales: number;
  orderCount?: number;
}
interface TooltipPayloadItem {
  payload: {
    date: string;
  };
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function SalesTrendTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <Calendar className="h-3 w-3" />
          <span>{payload[0].payload.date}</span>
        </div>
        <div className="text-sm font-bold font-mono text-foreground">
          ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
          Daily Revenue
        </div>
      </div>
    );
  }
  return null;
}

export function SalesTrendChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Calculate date range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // 7 days including today

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    fetch(`/api/analytics/sales-trend?startDate=${startDateStr}&endDate=${endDateStr}&period=week`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((result) => {
        // Format dates for better display (show as DD/MM)
        const formattedData = (result.data || []).map((item: SalesData) => {
          const dateParts = item.date.split('-');
          const displayDate = `${dateParts[2]}/${dateParts[1]}`;
          return {
            ...item,
            date: displayDate,
            sales: Number(item.sales) || 0,
          };
        });
        setData(formattedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sales trend:', error);
        setLoading(false);
      });
  }, []); // Empty deps - will refetch on page reload after outlet switch

  const total7DaysSales = data.reduce((sum, d) => sum + d.sales, 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-[220px] sm:h-[260px] flex items-end gap-2 p-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-muted/50 rounded-t animate-pulse"
              style={{ height: `${(i % 3 + 1) * 28}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
              Sales Revenue
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <TrendingUp className="h-3 w-3" />
              7 Days
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total: ₹{total7DaysSales.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[210px] sm:h-[250px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No sales recorded in the last 7 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -15,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-border/40"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              />
              <Tooltip content={<SalesTrendTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}


