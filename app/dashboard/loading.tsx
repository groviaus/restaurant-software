export default function DashboardLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* Quick Actions Skeleton */}
      <div className="hidden sm:block h-12 w-full rounded-xl border border-border/50 bg-card/60" />

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-32 bg-muted rounded-lg" />
            <div className="h-5 w-20 bg-muted rounded-full" />
          </div>
          <div className="h-4 w-64 bg-muted/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-muted rounded-lg hidden sm:block" />
          <div className="h-8 w-20 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 px-1 sm:px-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-xl border border-border/50 bg-card p-4 sm:p-5 ${
              i === 2 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3.5 w-16 bg-muted rounded" />
              <div className="h-7 w-7 rounded-lg bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-24 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Active Orders Strip Skeleton */}
      <div className="h-28 w-full rounded-xl border border-border/50 bg-card p-5 px-1 sm:px-0" />

      {/* Charts Grid Skeleton */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-1 sm:px-0">
        <div className="h-[290px] rounded-xl border border-border/50 bg-card p-5" />
        <div className="h-[290px] rounded-xl border border-border/50 bg-card p-5" />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-1 sm:px-0">
        <div className="h-[290px] rounded-xl border border-border/50 bg-card p-5" />
        <div className="h-[290px] rounded-xl border border-border/50 bg-card p-5" />
      </div>
    </div>
  );
}

