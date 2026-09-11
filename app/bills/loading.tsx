import { Skeleton } from '@/components/ui/skeleton';

export default function BillsLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-4 w-60 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8.5 w-64 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8.5 w-24 rounded-xl" />
          <Skeleton className="h-8.5 w-16 rounded-xl" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
