'use client';

import { useState } from 'react';
import { useOrdersQuery } from '@/hooks/queries/useOrdersQuery';
import { useTablesQuery } from '@/hooks/queries/useTablesQuery';
import { BillsTable } from '@/components/tables/BillsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useOutlet } from '@/hooks/useOutlet';

interface BillsPageClientProps {
  outletId?: string;
}

export function BillsPageClient({ outletId: propOutletId }: BillsPageClientProps) {
  const { currentOutletId } = useOutlet();
  const outletId = propOutletId || currentOutletId || '';
  const [isSyncing, setIsSyncing] = useState(false);
  const billsQuery = useOrdersQuery(outletId, { status: 'COMPLETED', limit: 200 });
  const tablesQuery = useTablesQuery(outletId);

  const bills = billsQuery.data ?? [];
  const tables = tablesQuery.data ?? [];

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([billsQuery.refetch(), tablesQuery.refetch()]);
      toast.success('Bills and invoices synced');
    } catch {
      toast.error('Failed to sync bills');
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  const isLoading = billsQuery.isLoading && bills.length === 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Bills & Invoices
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground min-w-6 inline-flex items-center justify-center">
              {isLoading ? <Skeleton className="h-3 w-5" /> : bills.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            View, audit, reprint thermal receipts, and reconcile payment collections.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Invoices Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Invoices</span>
          </div>

          {/* Sync Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 border-border/70"
            title="Refresh bills and receipts"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* Main Bills Table / Grid View Component */}
      <BillsTable
        bills={bills}
        outletId={outletId}
        tables={tables}
        loading={isLoading}
        onRefresh={() => {
          billsQuery.refetch();
          tablesQuery.refetch();
        }}
      />
    </div>
  );
}
