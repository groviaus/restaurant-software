'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryMovement, InventoryTransactionType, InventoryItem } from '@/lib/types';
import { formatStockDisplay } from '@/lib/inventory/unitConversions';
import { format } from 'date-fns';
import {
  Search,
  X,
  ClipboardList,
  FilterX,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TX_TYPE_CONFIG: Partial<Record<InventoryTransactionType, { label: string; sign: '+' | '-' | '±'; color: string }>> = {
  [InventoryTransactionType.OPENING_STOCK]:          { label: 'Opening Stock',       sign: '+', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  [InventoryTransactionType.PURCHASE]:               { label: 'Purchase Receipt',    sign: '+', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  [InventoryTransactionType.PURCHASE_RETURN]:        { label: 'Purchase Return',     sign: '-', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  [InventoryTransactionType.SALE_CONSUMPTION]:       { label: 'Sale Consumption',    sign: '-', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
  [InventoryTransactionType.WASTAGE]:                { label: 'Wastage',             sign: '-', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  [InventoryTransactionType.SPOILAGE]:               { label: 'Spoilage',            sign: '-', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  [InventoryTransactionType.DAMAGE]:                 { label: 'Damage',              sign: '-', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  [InventoryTransactionType.STOCK_COUNT_ADJUSTMENT]: { label: 'Stock Count Variance',sign: '±', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  [InventoryTransactionType.MANUAL_ADJUSTMENT]:      { label: 'Manual Adjustment',   sign: '±', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  [InventoryTransactionType.PRODUCTION]:             { label: 'Production',          sign: '+', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  [InventoryTransactionType.TRANSFER_IN]:            { label: 'Transfer In',         sign: '+', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  [InventoryTransactionType.TRANSFER_OUT]:           { label: 'Transfer Out',        sign: '-', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  [InventoryTransactionType.CUSTOMER_RETURN]:        { label: 'Order Cancellation',  sign: '+', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

interface InventoryMovementsLogProps {
  movements: InventoryMovement[];
  inventoryItems: InventoryItem[];
  onRefetch: () => void;
}

export function InventoryMovementsLog({ movements, inventoryItems, onRefetch }: InventoryMovementsLogProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const itemName = (m.inventory_item as any)?.name ?? '';
      const matchSearch =
        !search ||
        itemName.toLowerCase().includes(search.toLowerCase()) ||
        (m.reason ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.reference_label ?? '').toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || m.transaction_type === typeFilter;
      const matchItem = itemFilter === 'all' || m.inventory_item_id === itemFilter;

      return matchSearch && matchType && matchItem;
    });
  }, [movements, search, typeFilter, itemFilter]);

  const hasFilters = search || typeFilter !== 'all' || itemFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setItemFilter('all');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Control Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card/60 p-2.5 sm:p-3 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item, order #, reason..."
              className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/60 bg-background/80 focus-visible:ring-primary/20 shadow-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Item Filter */}
          <Select value={itemFilter} onValueChange={setItemFilter}>
            <SelectTrigger className="h-8.5 w-[130px] sm:w-[150px] text-xs rounded-xl border-border/60 bg-background/80 shadow-none">
              <SelectValue placeholder="All Items" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Items</SelectItem>
              {inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs">{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8.5 w-[140px] sm:w-[160px] text-xs rounded-xl border-border/60 bg-background/80 shadow-none">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Transaction Types</SelectItem>
              {Object.entries(TX_TYPE_CONFIG).map(([val, info]) => (
                <SelectItem key={val} value={val} className="text-xs">{info?.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}

          <span className="text-[11px] font-mono font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
            {filtered.length} entries
          </span>
        </div>
      </div>

      {/* 2. Movements Table */}
      <div className="rounded-2xl border border-border/70 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              <TableHead className="py-3 px-4">Date & Time</TableHead>
              <TableHead className="py-3 px-4">Inventory Item</TableHead>
              <TableHead className="py-3 px-4">Transaction Type</TableHead>
              <TableHead className="py-3 px-4 text-right">Net Change</TableHead>
              <TableHead className="py-3 px-4">Stock Transition</TableHead>
              <TableHead className="py-3 px-4">Audit Reason & Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 border border-border/60 shadow-2xs">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">No ledger movements found</p>
                      <p className="text-xs text-muted-foreground">
                        Every stock mutation (sales consumption, counts, wastage, purchase receipts) creates an immutable transaction here.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((mov) => {
                const config = TX_TYPE_CONFIG[mov.transaction_type] ?? {
                  label: mov.transaction_type,
                  sign: '±',
                  color: 'text-muted-foreground bg-muted',
                };
                const isPositive = Number(mov.quantity_change) > 0;
                const isZero = Number(mov.quantity_change) === 0;

                return (
                  <TableRow
                    key={mov.id}
                    className="hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0"
                  >
                    <TableCell className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                      {format(new Date(mov.created_at), 'dd MMM yyyy, HH:mm')}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <p className="font-semibold text-foreground text-xs">
                        {(mov.inventory_item as any)?.name ?? 'Deleted Item'}
                      </p>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs',
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right">
                      <span
                        className={cn(
                          'font-mono font-bold text-xs inline-flex items-center gap-0.5',
                          isZero
                            ? 'text-muted-foreground'
                            : isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {mov.quantity_change} {mov.unit}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      <span>{mov.quantity_before}</span>
                      <span className="mx-1 text-muted-foreground/50">→</span>
                      <span className="font-semibold text-foreground">{mov.quantity_after} {mov.unit}</span>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="text-foreground font-medium text-xs">
                          {mov.reason || <span className="text-muted-foreground/50">—</span>}
                        </p>
                        {mov.reference_label && (
                          <p className="text-[11px] font-mono text-primary font-semibold">
                            {mov.reference_label}
                          </p>
                        )}
                        {mov.notes && (
                          <p className="text-[11px] text-muted-foreground italic">
                            {mov.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
