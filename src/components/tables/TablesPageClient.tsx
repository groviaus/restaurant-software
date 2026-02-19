'use client';

import { useTablesQuery } from '@/hooks/queries/useTablesQuery';
import { useOrdersQuery } from '@/hooks/queries/useOrdersQuery';
import { TableGrid } from '@/components/tables/TableGrid';
import { Skeleton } from '@/components/ui/skeleton';

interface TablesPageClientProps {
  outletId: string;
}

export function TablesPageClient({ outletId }: TablesPageClientProps) {
  const tablesQuery = useTablesQuery(outletId);
  const activeOrdersQuery = useOrdersQuery(outletId, {
    status: 'NEW,PREPARING,READY,SERVED',
    limit: 200,
  });

  const tables = tablesQuery.data ?? [];
  const activeOrders = activeOrdersQuery.data ?? [];

  if (tablesQuery.isLoading && tables.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600">Manage your restaurant tables</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
        <p className="text-gray-600">Manage your restaurant tables</p>
      </div>
      <TableGrid
        tables={tables}
        outletId={outletId}
        activeOrders={activeOrders}
      />
    </div>
  );
}
