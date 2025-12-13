'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const chartConfig = {
  orders: {
    label: 'Orders',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function PeakHoursChart() {
  const [data, setData] = useState<Array<{ hour: string; orders: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/peak-hours?days=30')
      .then((res) => res.json())
      .then((result) => {
        // Filter to show only hours with orders and group by 2-hour intervals for better visualization
        const filtered = (result.data || []).filter((item: any) => item.orders > 0);
        // Group into 2-hour intervals
        const grouped: Record<string, number> = {};
        filtered.forEach((item: any) => {
          const hour = parseInt(item.hour.split(':')[0]);
          const interval = `${Math.floor(hour / 2) * 2}-${Math.floor(hour / 2) * 2 + 2}`;
          grouped[interval] = (grouped[interval] || 0) + item.orders;
        });
        const chartData = Object.entries(grouped).map(([hour, orders]) => ({
          hour: `${hour}:00`,
          orders,
        }));
        setData(chartData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>Order distribution by time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>Order distribution by time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Hours</CardTitle>
        <CardDescription>Order distribution by time (Last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

