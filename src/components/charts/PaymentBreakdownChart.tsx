'use client';

import { useEffect, useState } from 'react';
import { Pie, PieChart, Label, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

interface PaymentItem {
  method: string;
  amount: number;
}

const colorMap: Record<string, string> = {
  upi: '#6366f1',   // Indigo
  cash: '#10b981',  // Emerald
  card: '#f59e0b',  // Amber
};

interface PaymentPayloadItem {
  payload: PaymentItem;
}

interface PaymentTooltipProps {
  active?: boolean;
  payload?: PaymentPayloadItem[];
}

function PaymentBreakdownTooltip({ active, payload }: PaymentTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colorMap[item.method.toLowerCase()] || '#6366f1' }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {item.method}
          </span>
        </div>
        <div className="text-sm font-bold font-mono text-foreground">
          ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          Settlement Method
        </div>
      </div>
    );
  }
  return null;
}

export function PaymentBreakdownChart() {
  const { data = [], isLoading: loading } = useQuery<PaymentItem[]>({
    queryKey: ['analytics', 'payment-breakdown'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/payment-breakdown?days=30');
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getChartColor = (method: string): string => {
    return colorMap[method.toLowerCase()] || '#6366f1';
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
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-[220px] sm:h-[250px] flex items-center justify-center">
          <div className="h-36 w-36 rounded-full border-8 border-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
              Payment Methods
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-3 w-3" />
              30 Days
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Settlement distribution
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
          No payment data recorded in the last 30 days
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="sm:col-span-6 h-[170px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<PaymentBreakdownTooltip />} />
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="method"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getChartColor(entry.method)}
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 4}
                              className="fill-foreground text-sm font-bold font-mono"
                            >
                              {formatCurrency(totalPaymentAmount)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 14}
                              className="fill-muted-foreground text-[10px] uppercase font-semibold tracking-wider"
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
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div className="sm:col-span-6 space-y-2">
            {data.map((item, index) => {
              const percentage = totalPaymentAmount > 0
                ? ((item.amount / totalPaymentAmount) * 100).toFixed(0)
                : '0';
              const color = getChartColor(item.method);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium uppercase tracking-wider text-foreground truncate">
                      {item.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {percentage}%
                    </span>
                    <span className="text-xs font-bold font-mono text-foreground">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


