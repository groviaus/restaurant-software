'use client';

import { useEffect, useState } from 'react';
import { Pie, PieChart, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const chartConfig = {
  Cash: {
    label: 'Cash',
    color: 'hsl(var(--chart-1))',
  },
  UPI: {
    label: 'UPI',
    color: 'hsl(var(--chart-2))',
  },
  Card: {
    label: 'Card',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function PaymentBreakdownChart() {
  const [data, setData] = useState<Array<{ method: string; amount: number; fill: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/analytics/payment-breakdown?days=30')
      .then((res) => res.json())
      .then((result) => {
        setData(result.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // Empty deps - will refetch on page reload after outlet switch

  // Helper function to get chart colors
  const getChartColor = (method: string): string => {
    const colorMap: Record<string, string> = {
      'cash': '#ea580c',    // Orange (chart-1)
      'upi': '#0891b2',     // Cyan (chart-2)
      'card': '#0f766e',    // Teal (chart-3)
    };
    return colorMap[method.toLowerCase()] || '#ea580c';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPaymentAmount = data.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-gray-500">
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
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ChartContainer
            config={data.reduce((acc, item) => {
              const colorMap: Record<string, string> = {
                'cash': 'var(--chart-1)',  // Orange/Red
                'upi': 'var(--chart-2)',   // Blue
                'card': 'var(--chart-3)',  // Green
              };
              const key = item.method.toLowerCase();
              acc[key] = {
                label: item.method,
                color: colorMap[key] || 'var(--chart-1)',
              };
              return acc;
            }, {} as ChartConfig)}
            className="mx-auto aspect-square max-h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number)}
                    hideLabel
                  />
                }
              />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="method"
                innerRadius={50}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {formatCurrency(totalPaymentAmount)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend */}
          <div className="space-y-2">
            {data.map((item, index) => {
              const percentage = ((item.amount / totalPaymentAmount) * 100).toFixed(1);
              const color = getChartColor(item.method);

              return (
                <div key={index} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0 border border-border/50"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium capitalize">{item.method}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                    <span className="text-sm font-semibold min-w-[80px] text-right">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

