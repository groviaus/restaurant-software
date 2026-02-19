import { Skeleton } from '@/components/ui/skeleton';

export default function OutletsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Outlets</h1>
        <p className="text-gray-600">Manage your restaurant outlets</p>
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
