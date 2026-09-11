'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableForm } from '@/components/forms/TableForm';
import { OrderForm } from '@/components/forms/OrderForm';
import { BillModal } from '@/components/billing/BillModal';
import {
  Utensils,
  Users,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Receipt,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { cn } from '@/lib/utils';
import { useRealtimeTables, useRealtimeOrders } from '@/hooks/useRealtime';
import { usePermissions } from '@/hooks/usePermissions';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteTableMutation, useCreateTableMutation } from '@/hooks/mutations/useTableMutations';

interface TableGridProps {
  tables: Table[];
  outletId: string;
  onRefresh?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeOrders?: any[];
}

export function TableGrid({
  tables: initialTables,
  outletId,
  onRefresh,
  activeOrders: initialActiveOrders = [],
}: TableGridProps) {
  const queryClient = useQueryClient();
  const deleteTableMutation = useDeleteTableMutation();
  const createTableMutation = useCreateTableMutation();
  const { tables: storeTables, setTables } = useTableOrderStore();

  // Modals state
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderToEdit, setOrderToEdit] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [billOrder, setBillOrder] = useState<any>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<'ALL' | '2' | '4' | '6+'>('ALL');

  // Active orders state with server fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeOrdersOverride, setActiveOrdersOverride] = useState<any[] | null>(null);
  const activeOrders = activeOrdersOverride ?? initialActiveOrders;
  const { checkPermission, isAdmin } = usePermissions();

  const canCreate = isAdmin || checkPermission('tables', 'create');
  const canEdit = isAdmin || checkPermission('tables', 'edit');
  const canDelete = isAdmin || checkPermission('tables', 'delete');

  // Sync store with incoming server tables
  useEffect(() => {
    if (initialTables && initialTables.length > 0) {
      setTables(initialTables);
    }
  }, [initialTables, setTables]);

  const tables = storeTables.length > 0 ? storeTables : initialTables;

  // Fetch active dine-in orders on real-time events
  const fetchActiveOrders = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/orders?outlet_id=${outletId}&status=NEW,PREPARING,READY,SERVED`
      );

      if (response.ok) {
        const allOrders = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableOrders = (allOrders || []).filter((order: any) => order.order_type === 'DINE_IN');
        setActiveOrdersOverride(tableOrders);
      }
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
    }
  }, [outletId]);

  const refetchTables = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['tables'] });
    onRefresh?.();
  }, [queryClient, onRefresh]);

  // Real-time table updates
  useRealtimeTables({
    outletId,
    onChange: () => {
      refetchTables();
      fetchActiveOrders();
    },
  });

  // Real-time orders updates
  useRealtimeOrders({
    outletId,
    onInsert: () => {
      refetchTables();
      fetchActiveOrders();
    },
    onChange: () => {
      refetchTables();
      fetchActiveOrders();
    },
  });

  // Orders mapped to table
  const getOrdersForTable = (tableId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return activeOrders.filter((order: any) => order.table_id === tableId);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }
    try {
      await deleteTableMutation.mutateAsync({ id, outletId });
      setTables(tables.filter((t) => t.id !== id));
      toast.success(`${name} deleted`);
      onRefresh?.();
    } catch {
      // Toast handled by mutation
    }
  };

  const handleAdd = () => {
    setEditingTable(null);
    setFormOpen(true);
  };

  // Quick Seed: Add 4 standard tables if floor is empty
  const handleQuickSeed = async () => {
    try {
      const sampleTables = [
        { name: 'Table 1', capacity: 2 },
        { name: 'Table 2', capacity: 4 },
        { name: 'Table 3', capacity: 4 },
        { name: 'Table 4', capacity: 6 },
      ];

      for (const t of sampleTables) {
        await createTableMutation.mutateAsync({
          outlet_id: outletId,
          name: t.name,
          capacity: t.capacity,
          status: TableStatus.EMPTY,
        });
      }

      toast.success('Added 4 starter tables to your floor plan!');
      refetchTables();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create starter tables';
      toast.error(msg);
    }
  };

  // Start new order on a specific table
  const handleStartOrderOnTable = (table: Table) => {
    setOrderToEdit(null);
    setSelectedTableForOrder(table.id);
    setOrderFormOpen(true);
  };

  // Add items / edit active order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditOrder = (order: any) => {
    setOrderToEdit(order);
    setSelectedTableForOrder(order.table_id);
    setOrderFormOpen(true);
  };

  // Settle bill on table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSettleBill = (order: any) => {
    setBillOrder(order);
    setBillModalOpen(true);
  };

  // Calculations & Filtering
  const emptyCount = tables.filter(
    (t) => t.status === TableStatus.EMPTY || t.status === TableStatus.BILLED
  ).length;
  const occupiedCount = tables.filter((t) => t.status === TableStatus.OCCUPIED).length;
  const totalSeats = tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  // Floor orders: strictly DINE_IN orders assigned to a valid floor table
  const floorOrders = useMemo(() => {
    const tableIdSet = new Set(tables.map((t) => t.id));
    return activeOrders.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => o.order_type === 'DINE_IN' && o.table_id && tableIdSet.has(o.table_id)
    );
  }, [activeOrders, tables]);

  const activeFloorRevenue = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return floorOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
  }, [floorOrders]);

  const filteredAndSortedTables = useMemo(() => {
    return tables
      .map((table) => ({
        ...table,
        status: table.status === TableStatus.BILLED ? TableStatus.EMPTY : table.status,
      }))
      .filter((table) => {
        // Status filter
        if (statusFilter !== 'ALL' && table.status !== statusFilter) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = table.name.toLowerCase().includes(q);
          const capMatch = table.capacity ? `${table.capacity}`.includes(q) || `${table.capacity} seats`.includes(q) : false;
          if (!nameMatch && !capMatch) return false;
        }
        // Capacity filter
        if (capacityFilter === '2' && table.capacity !== 2) return false;
        if (capacityFilter === '4' && table.capacity !== 4) return false;
        if (capacityFilter === '6+' && (!table.capacity || table.capacity < 6)) return false;

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [tables, statusFilter, searchQuery, capacityFilter]);

  return (
    <>
      <div className="space-y-4">
        {/* 1. Floor Analytics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Total Tables */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Floor Tables
              </span>
              <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Utensils className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
              {tables.length}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {totalSeats} total seating capacity
            </p>
          </div>

          {/* Available Tables */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Available
              </span>
              <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {emptyCount}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Ready for walk-in guests
            </p>
          </div>

          {/* Occupied Tables */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Occupied
              </span>
              <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {occupiedCount}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {tables.length > 0 ? `${Math.round((occupiedCount / tables.length) * 100)}% floor occupancy` : 'No tables'}
            </p>
          </div>

          {/* Running Floor Bill */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Floor Bills
              </span>
              <div className="h-7 w-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Receipt className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
              ₹{activeFloorRevenue.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {floorOrders.length} active table {floorOrders.length === 1 ? 'bill' : 'bills'}
            </p>
          </div>
        </div>

        {/* 2. Control Ribbon: Search, Filter Tabs & Add Table Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tables..."
                className="pl-8.5 pr-8 h-8.5 text-xs bg-card rounded-xl border-border/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  'h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border',
                  statusFilter === 'ALL'
                    ? 'bg-foreground text-background border-foreground shadow-xs'
                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 rounded-md bg-background/20 font-mono text-[10px]">
                  {tables.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(TableStatus.EMPTY)}
                className={cn(
                  'h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border',
                  statusFilter === TableStatus.EMPTY
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-card text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Available</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-emerald-900/60 font-mono text-[10px]">
                  {emptyCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(TableStatus.OCCUPIED)}
                className={cn(
                  'h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border',
                  statusFilter === TableStatus.OCCUPIED
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-card text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                )}
              >
                <Users className="h-3 w-3" />
                <span>Occupied</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-amber-900/60 font-mono text-[10px]">
                  {occupiedCount}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* Capacity Filters */}
            <div className="hidden sm:flex items-center gap-1">
              {(['ALL', '2', '4', '6+'] as const).map((cap) => (
                <button
                  key={cap}
                  onClick={() => setCapacityFilter(cap)}
                  className={cn(
                    'h-7 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer',
                    capacityFilter === cap
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {cap === 'ALL' ? 'All Sizes' : `${cap} Seats`}
                </button>
              ))}
            </div>

            {/* Add Table Primary Button */}
            {canCreate && (
              <Button
                size="sm"
                onClick={handleAdd}
                className="h-8.5 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5 w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Table</span>
              </Button>
            )}
          </div>
        </div>

        {/* 3. Empty State (When zero tables exist on floor) */}
        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-14 text-center bg-card/60 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <Utensils className="h-8 w-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                No Tables on Floor Plan Yet
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Set up your restaurant seating layout to manage guest tables, start dine-in tickets, and monitor live floor bills.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {canCreate && (
                <>
                  <Button
                    onClick={handleAdd}
                    className="h-10 px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Table</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleQuickSeed}
                    disabled={createTableMutation.isPending}
                    className="h-10 px-4 text-xs font-semibold rounded-xl border-border/70 hover:bg-muted text-foreground cursor-pointer flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Add 4 Starter Tables</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : filteredAndSortedTables.length === 0 ? (
          /* Filter zero matches state */
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/40 space-y-3">
            <p className="text-sm font-semibold text-foreground">No tables match your filter criteria</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
                setCapacityFilter('ALL');
              }}
              className="h-8 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* 4. Floor Table Tiles Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredAndSortedTables.map((table) => {
              const tableOrders = getOrdersForTable(table.id);
              const isOccupied = table.status === TableStatus.OCCUPIED;
              const hasOrders = tableOrders.length > 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tableTotal = tableOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

              return (
                <div
                  key={table.id}
                  className={cn(
                    'bg-card border rounded-2xl p-4 transition-all shadow-xs flex flex-col justify-between group relative space-y-3',
                    isOccupied
                      ? 'border-amber-300 dark:border-amber-700/60 bg-gradient-to-b from-amber-50/20 to-card hover:border-amber-400'
                      : 'border-border/70 hover:border-primary/40 hover:shadow-sm'
                  )}
                >
                  {/* Top Bar: Table Name, Capacity & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base sm:text-lg text-foreground tracking-tight">
                          {table.name}
                        </h3>
                        {isOccupied && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        )}
                      </div>

                      {table.capacity && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          <Users className="h-3 w-3" />
                          <span>{table.capacity} Seats</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isOccupied ? (
                        <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 text-[11px] font-bold">
                          Occupied
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 text-[11px] font-bold">
                          Available
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 py-1">
                    {isOccupied ? (
                      hasOrders ? (
                        <div className="space-y-2 bg-background/80 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-2.5">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {tableOrders.slice(0, 2).map((order: any) => {
                            const items = order.order_items || order.items || [];
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const itemsCount = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
                            const firstItem = items[0]?.items?.name || items[0]?.item?.name || items[0]?.item_name || 'Dish';

                            return (
                              <div key={order.id} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-mono font-bold text-[11px] text-foreground">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className="font-mono font-black text-foreground">
                                    ₹{Number(order.total || 0).toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate font-normal">
                                  {itemsCount} items • {firstItem}
                                  {items.length > 1 && ` +${items.length - 1} more`}
                                </p>
                              </div>
                            );
                          })}

                          {tableOrders.length > 2 && (
                            <p className="text-[10px] text-muted-foreground text-center italic">
                              +{tableOrders.length - 2} more active tickets
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="h-16 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground italic">
                          Seated • Awaiting order
                        </div>
                      )
                    ) : (
                      /* Empty Table Visual */
                      <div className="h-18 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-[11px]">Table is clean & ready</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(table)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit Table"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(table.id, table.name)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600 cursor-pointer"
                          title="Delete Table"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOccupied ? (
                        <>
                          {/* Settle Bill trigger */}
                          {hasOrders && (
                            <Button
                              size="sm"
                              onClick={() => handleSettleBill(tableOrders[0])}
                              className="h-7.5 px-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1"
                              title="Settle Bill and Print Receipt"
                            >
                              <Receipt className="h-3 w-3" />
                              <span>Bill (₹{tableTotal.toFixed(0)})</span>
                            </Button>
                          )}
                          {/* Add items to occupied table */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => (hasOrders ? handleEditOrder(tableOrders[0]) : handleStartOrderOnTable(table))}
                            className="h-7.5 px-2 text-xs font-semibold rounded-lg cursor-pointer border-border/70"
                            title="Add items"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                        </>
                      ) : (
                        /* Start New Dine-In Order on Table */
                        <Button
                          size="sm"
                          onClick={() => handleStartOrderOnTable(table)}
                          className="h-7.5 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>New Order</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Table Form Modal */}
      <TableForm
        open={formOpen}
        onOpenChange={setFormOpen}
        table={editingTable}
        outletId={outletId}
        nextTableNumber={tables.length + 1}
        onSuccess={() => {
          refetchTables();
        }}
      />

      {/* POS Order Creation Terminal pre-selected for Table */}
      {orderFormOpen && (
        <OrderForm
          open={orderFormOpen}
          onOpenChange={setOrderFormOpen}
          outletId={outletId}
          tables={tables}
          order={orderToEdit}
          initialTableId={selectedTableForOrder}
          onSuccess={() => {
            refetchTables();
            fetchActiveOrders();
          }}
        />
      )}

      {/* Settle Bill Modal */}
      {billModalOpen && billOrder && (
        <BillModal
          open={billModalOpen}
          onOpenChange={(open) => {
            setBillModalOpen(open);
            if (!open) {
              refetchTables();
              fetchActiveOrders();
            }
          }}
          order={billOrder}
        />
      )}
    </>
  );
}
