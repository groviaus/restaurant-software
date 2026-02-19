'use client';

import { useMenuItemsQuery } from '@/hooks/queries/useMenuQuery';
import { MenuTable } from '@/components/tables/MenuTable';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuPageClientProps {
  outletId: string;
}

export function MenuPageClient({ outletId }: MenuPageClientProps) {
  const menuQuery = useMenuItemsQuery(outletId);
  const items = menuQuery.data ?? [];

  if (menuQuery.isLoading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-md border p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <MenuTable items={items} outletId={outletId} />
  );
}
