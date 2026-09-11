'use client';

import { useEffect, useState } from 'react';
import { Users, Award } from 'lucide-react';

interface StaffPerformance {
  name: string;
  orders: number;
  sales: number;
}

export function StaffPerformanceList() {
  const [staff, setStaff] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/staff-performance?days=30&limit=5')
      .then((res) => res.json())
      .then((result) => {
        setStaff(result.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 0) return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
    if (rank === 1) return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    if (rank === 2) return 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30';
    return 'bg-muted text-muted-foreground border-border/50';
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
              Staff Performance
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Top contributors</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
          <Award className="h-3 w-3" />
          30 Days
        </span>
      </div>

      {staff.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No staff performance data recorded
        </div>
      ) : (
        <div className="space-y-2.5">
          {staff.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/15 p-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold font-mono flex-shrink-0 ${getRankBadgeStyle(
                    index
                  )}`}
                >
                  {index + 1}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/10 text-violet-700 dark:text-violet-300 font-semibold text-xs border border-violet-500/20 flex-shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {member.orders} orders closed
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                  ₹{member.sales.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  total sales
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


