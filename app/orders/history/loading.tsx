import { Skeleton } from '@/components/ui/skeleton';

export default function OrderHistoryLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600">View completed and cancelled orders</p>
      </div>
      <div className="rounded-md border">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
