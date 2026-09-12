'use client';

import { useState } from 'react';
import { useMenuItemsQuery, useCategoriesQuery } from '@/hooks/queries/useMenuQuery';
import { MenuTable } from '@/components/tables/MenuTable';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { useOutlet } from '@/hooks/useOutlet';

interface MenuPageClientProps {
  outletId?: string;
}

export function MenuPageClient({ outletId: propOutletId }: MenuPageClientProps) {
  const { currentOutletId } = useOutlet();
  const outletId = propOutletId || currentOutletId || '';
  const [isSyncing, setIsSyncing] = useState(false);
  const menuQuery = useMenuItemsQuery(outletId);
  const categoriesQuery = useCategoriesQuery(outletId);
  const items = menuQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([menuQuery.refetch(), categoriesQuery.refetch()]);
      toast.success('Menu catalog synced');
    } catch {
      toast.error('Failed to sync menu');
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  if (menuQuery.isLoading && items.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-5">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8.5 w-24 rounded-xl" />
            <Skeleton className="h-8.5 w-32 rounded-xl" />
          </div>
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>

        {/* Control Ribbon Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Skeleton className="h-8.5 w-64 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-8.5 w-36 rounded-xl" />
            <Skeleton className="h-8.5 w-16 rounded-xl" />
          </div>
        </div>

        {/* Grid Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <MenuTable
      items={items}
      categories={categories}
      outletId={outletId}
      isSyncing={isSyncing}
      onSync={handleManualSync}
      onRefresh={() => {
        menuQuery.refetch();
        categoriesQuery.refetch();
      }}
    />
  );
}
