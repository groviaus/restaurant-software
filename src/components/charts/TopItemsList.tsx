'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Flame, AlertCircle } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

export function TopItemsList() {
  const [activeTab, setActiveTab] = useState<'top' | 'low'>('top');

  const { data, isLoading: loading } = useQuery<{ top: TopItem[], low: TopItem[] }>({
    queryKey: ['analytics', 'top-items'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/top-items?days=30&limit=5');
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const topItems = data?.top || [];
  const lowItems = data?.low || [];

  const maxQuantity = topItems.length > 0 ? Math.max(...topItems.map((i) => i.quantity)) : 1;

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-7 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = activeTab === 'top' ? topItems : lowItems;

  const getRankBadgeStyle = (rank: number) => {
    if (activeTab === 'low') {
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    }
    if (rank === 0) return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
    if (rank === 1) return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    if (rank === 2) return 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30';
    return 'bg-muted text-muted-foreground border-border/50';
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header with Switch Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight flex items-center gap-1.5">
            {activeTab === 'top' ? (
              <Flame className="h-4 w-4 text-amber-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-500" />
            )}
            Item Performance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">30-day velocity</p>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
          <button
            onClick={() => setActiveTab('top')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'top'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>Top 5</span>
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'low'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="h-3 w-3 text-rose-500" />
            <span>Slow 5</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No item performance metrics available
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, index) => {
            const percentage = Math.round((item.quantity / maxQuantity) * 100);
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-border/40 bg-muted/15 p-2.5 transition-colors hover:bg-muted/40"
              >
                {/* Visual progress bar fill */}
                {activeTab === 'top' && (
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500/5 transition-all duration-500 rounded-l-lg pointer-events-none"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold font-mono flex-shrink-0 ${getRankBadgeStyle(
                        index
                      )}`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.quantity} units ordered
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                      ₹{item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      revenue
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


