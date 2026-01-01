'use client';

import { useEffect, useState } from 'react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HourData {
  hour: string;
  orders: number;
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
          .map(({ intervalStart, ...rest }) => rest);
        
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
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>Order distribution by time (Last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
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
          <CardDescription>Order distribution by time (Last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {`Time: ${payload[0].payload.hour}`}
          </p>
          <p className="text-sm text-green-600">
            {`Orders: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Hours</CardTitle>
        <CardDescription>Order distribution by time (Last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
              />
              <XAxis 
                dataKey="hour"
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="orders" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Orders"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

