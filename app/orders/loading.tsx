import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersLoading() {
  return (
    <div className="space-y-5">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-8.5 w-20 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Control Bar Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Skeleton className="h-9 w-full sm:w-64 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-18 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Ticket Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/70 p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-8.5 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
