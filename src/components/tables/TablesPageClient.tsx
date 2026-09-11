'use client';

import { useState } from 'react';
import { useTablesQuery } from '@/hooks/queries/useTablesQuery';
import { useOrdersQuery } from '@/hooks/queries/useOrdersQuery';
import { TableGrid } from '@/components/tables/TableGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TablesPageClientProps {
  outletId: string;
}

export function TablesPageClient({ outletId }: TablesPageClientProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const tablesQuery = useTablesQuery(outletId);
  const activeOrdersQuery = useOrdersQuery(outletId, {
    status: 'NEW,PREPARING,READY,SERVED',
    limit: 200,
  });

  const tables = tablesQuery.data ?? [];
  const activeOrders = activeOrdersQuery.data ?? [];

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([tablesQuery.refetch(), activeOrdersQuery.refetch()]);
      toast.success('Floor plan and table orders synced');
    } catch {
      toast.error('Failed to sync tables');
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  if (tablesQuery.isLoading && tables.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Tables & Floor
            </h1>
          </div>
        </div>

        {/* Skeleton Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Tables & Floor
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {tables.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Sync Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Floor</span>
          </div>

          {/* Sync Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 border-border/70"
            title="Refresh tables and active floor bills"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* Main Table Grid Component */}
      <TableGrid
        tables={tables}
        outletId={outletId}
        activeOrders={activeOrders}
        onRefresh={() => {
          tablesQuery.refetch();
          activeOrdersQuery.refetch();
        }}
      />
    </div>
  );
}
