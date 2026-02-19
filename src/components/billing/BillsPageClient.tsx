'use client';

import { useOrdersQuery } from '@/hooks/queries/useOrdersQuery';
import { useTablesQuery } from '@/hooks/queries/useTablesQuery';
import { BillsTable } from '@/components/tables/BillsTable';
import { Skeleton } from '@/components/ui/skeleton';

interface BillsPageClientProps {
  outletId: string;
}

export function BillsPageClient({ outletId }: BillsPageClientProps) {
  const billsQuery = useOrdersQuery(outletId, { status: 'COMPLETED', limit: 200 });
  const tablesQuery = useTablesQuery(outletId);

  const bills = billsQuery.data ?? [];
  const tables = tablesQuery.data ?? [];

  if (billsQuery.isLoading && bills.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600">View and manage all bills and receipts</p>
        </div>
        <div className="rounded-md border">
          <div className="p-4 border-b flex gap-4">
            <Skeleton className="h-9 w-24" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
        <p className="text-gray-600">View and manage all bills and receipts</p>
      </div>
      <BillsTable bills={bills} outletId={outletId} tables={tables} />
    </div>
  );
}
