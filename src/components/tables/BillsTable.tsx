'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OrderWithItems, PaymentMethod, Table as TableType } from '@/lib/types';
import {
  Eye,
  Search,
  QrCode,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Receipt,
  CreditCard,
  Banknote,
  TrendingUp,
  Utensils,
  ShoppingBag,
  Clock,
  User,
  X,
} from 'lucide-react';
import { BillModal } from '@/components/billing/BillModal';
import { format } from 'date-fns';
import { useRealtimeOrders } from '@/hooks/useRealtime';
import { BillsFilters, BillsFilters as FiltersType } from '@/components/billing/BillsFilters';
import { cn } from '@/lib/utils';

interface BillsTableProps {
  bills: OrderWithItems[];
  outletId: string;
  tables: TableType[];
  onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 12;

export function BillsTable({ bills: initialBills, outletId, tables, onRefresh }: BillsTableProps) {
  const [selectedBill, setSelectedBill] = useState<OrderWithItems | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY'>('ALL');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // View mode: default to grid on mobile, persisted in localStorage
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resto_bills_view_mode');
        if (saved === 'grid' || saved === 'table') return saved;
      } catch {
        // ignore
      }
    }
    return 'grid';
  });

  const [filters, setFilters] = useState<FiltersType>({
    datePreset: 'today',
    orderTypes: [],
    paymentMethods: [],
  });

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('resto_bills_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const [localBillsOverride, setLocalBillsOverride] = useState<OrderWithItems[] | null>(null);
  const bills = localBillsOverride ?? initialBills;

  // Function to refetch bills from API
  const refetchBills = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders?outlet_id=${outletId}&status=COMPLETED&limit=200`);
      if (response.ok) {
        const data = await response.json();
        setLocalBillsOverride(Array.isArray(data) ? data : []);
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to refetch bills:', error);
    }
  }, [outletId, onRefresh]);

  // Subscribe to real-time order completions
  useRealtimeOrders({
    outletId,
    onChange: (payload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRecord = payload.new as any;
      if (newRecord?.status === 'COMPLETED' || payload.eventType === 'UPDATE') {
        refetchBills();
      }
    },
  });

  // Calculate Date Ranges
  const getDateRange = (preset: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    switch (preset) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
        }
        break;
      case 'all':
        return null;
      default:
        return null;
    }

    return { start, end };
  };

  // Elapsed time formatter with days calculation for >24 hours
  const getElapsedDisplay = (dateString: string) => {
    const diffMs = currentTime - new Date(dateString).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) {
      return `${hours}h ${remMins}m ago`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (remHours === 0) {
      return `${days}d ago`;
    }
    return `${days}d ${remHours}h ago`;
  };

  // Apply filters
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // 1. Order Type Quick Filter
      if (orderTypeFilter !== 'ALL' && bill.order_type !== orderTypeFilter) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableName = ((bill as any).tables?.name || (bill as any).table?.name || '').toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staffName = ((bill as any).users?.name || (bill as any).user?.name || '').toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (bill as any).order_items || (bill as any).items || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemsMatch = items.some((item: any) =>
          (item.item?.name || item.item_name || '').toLowerCase().includes(query)
        );

        const matchesSearch =
          bill.id.toLowerCase().includes(query) ||
          bill.id.replace(/-/g, '').toLowerCase().includes(query.replace(/-/g, '')) ||
          tableName.includes(query) ||
          staffName.includes(query) ||
          bill.order_type.toLowerCase().includes(query) ||
          (bill.payment_method || '').toLowerCase().includes(query) ||
          itemsMatch;

        if (!matchesSearch) return false;
      }

      // 3. Date filter
      const dateRange = getDateRange(filters.datePreset, filters.customStartDate, filters.customEndDate);
      if (dateRange) {
        const billDate = new Date(bill.created_at);
        if (billDate < dateRange.start || billDate > dateRange.end) {
          return false;
        }
      }

      // 4. Drawer: Order type filter
      if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(bill.order_type)) {
        return false;
      }

      // 5. Drawer: Payment method filter
      if (filters.paymentMethods.length > 0) {
        if (!bill.payment_method || !filters.paymentMethods.includes(bill.payment_method as PaymentMethod)) {
          return false;
        }
      }

      // 6. Drawer: Table filter
      if (filters.tableId && bill.table_id !== filters.tableId) {
        return false;
      }

      // 7. Drawer: Amount range filter
      const amount = Number(bill.total) || 0;
      if (filters.minAmount !== undefined && amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [bills, searchQuery, orderTypeFilter, filters]);

  // Executive KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalRevenue = filteredBills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const count = filteredBills.length;
    let cashSum = 0;
    let cashCount = 0;
    let digitalSum = 0;
    let digitalCount = 0;

    for (const b of filteredBills) {
      const amt = Number(b.total) || 0;
      if (b.payment_method === PaymentMethod.CASH) {
        cashSum += amt;
        cashCount++;
      } else if (b.payment_method === PaymentMethod.UPI || b.payment_method === PaymentMethod.CARD) {
        digitalSum += amt;
        digitalCount++;
      }
    }

    const avgTicket = count > 0 ? totalRevenue / count : 0;
    const digitalPercentage = totalRevenue > 0 ? Math.round((digitalSum / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      count,
      cashSum,
      cashCount,
      digitalSum,
      digitalCount,
      avgTicket,
      digitalPercentage,
    };
  }, [filteredBills]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBills.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  const handleViewBill = (bill: OrderWithItems) => {
    setSelectedBill(bill);
    setBillModalOpen(true);
  };

  const getPaymentBadge = (method?: string | null) => {
    switch (method) {
      case PaymentMethod.CASH:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
            <Banknote className="h-3 w-3" />
            CASH
          </span>
        );
      case PaymentMethod.UPI:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            <QrCode className="h-3 w-3" />
            UPI
          </span>
        );
      case PaymentMethod.CARD:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
            <CreditCard className="h-3 w-3" />
            CARD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
            {method || 'N/A'}
          </span>
        );
    }
  };

  const activeFiltersCount =
    (orderTypeFilter !== 'ALL' ? 1 : 0) +
    (filters.orderTypes.length > 0 ? 1 : 0) +
    (filters.paymentMethods.length > 0 ? 1 : 0) +
    (filters.tableId ? 1 : 0) +
    (filters.datePreset !== 'today' ? 1 : 0) +
    (filters.minAmount !== undefined && filters.minAmount > 0 ? 1 : 0) +
    (filters.maxAmount !== undefined && filters.maxAmount > 0 ? 1 : 0);

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        {/* 1. Executive Metric Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Total Billed Sales */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Billed
              </span>
              <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Receipt className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
              ₹{metrics.totalRevenue.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {metrics.count} {metrics.count === 1 ? 'bill settled' : 'bills settled'}
            </p>
          </div>

          {/* Digital Payments */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Digital Pay
              </span>
              <div className="h-7 w-7 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-sky-600 dark:text-sky-400">
              ₹{metrics.digitalSum.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {metrics.digitalPercentage}% UPI & Cards ({metrics.digitalCount})
            </p>
          </div>

          {/* Cash in Till */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cash Settled
              </span>
              <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Banknote className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹{metrics.cashSum.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {metrics.cashCount} cash {metrics.cashCount === 1 ? 'bill' : 'bills'}
            </p>
          </div>

          {/* Average Ticket Size */}
          <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Ticket (ATV)
              </span>
              <div className="h-7 w-7 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
              ₹{metrics.avgTicket.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              Average revenue per bill
            </p>
          </div>
        </div>

        {/* 2. Control Ribbon: Search, Dining Filter, View Switcher & Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search bills, items, staff..."
              className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/60 bg-background/80 focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Quick Segment Filter: All / Dine In / Takeaway */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              {(['ALL', 'DINE_IN', 'TAKEAWAY'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setOrderTypeFilter(type);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                    orderTypeFilter === type
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {type === 'ALL' ? 'All' : type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Grid / Table */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                className={cn(
                  'h-7.5 w-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Grid / Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('table')}
                className={cn(
                  'h-7.5 w-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter Drawer Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'h-8.5 px-2.5 text-xs font-semibold rounded-xl border-border/60 cursor-pointer flex items-center gap-1.5 transition-all',
                showFilters || activeFiltersCount > 0
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-background hover:bg-muted/70'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Collapsible Filter Drawer */}
        {showFilters && (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
            <BillsFilters
              tables={tables}
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* 4. Results Header Counter */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            Showing <strong className="font-semibold text-foreground">{filteredBills.length}</strong>{' '}
            {filteredBills.length === 1 ? 'bill' : 'bills'}
          </span>
          {(searchQuery || orderTypeFilter !== 'ALL' || activeFiltersCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setOrderTypeFilter('ALL');
                setFilters({
                  datePreset: 'today',
                  orderTypes: [],
                  paymentMethods: [],
                });
                setCurrentPage(1);
              }}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* 5. Mobile-First Card Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {paginatedBills.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center space-y-3 bg-card/40">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No bills match your criteria</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try changing your search query, adjusting the date range, or resetting filters.
                  </p>
                </div>
              </div>
            ) : (
              paginatedBills.map((bill, index) => {
                const billNumber = filteredBills.length - (startIndex + index);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tableName = (bill as any).tables?.name || (bill as any).table?.name;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const staffName = (bill as any).users?.name || (bill as any).user?.name;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items = (bill as any).order_items || (bill as any).items || [];
                const isOlderThan24h = currentTime - new Date(bill.created_at).getTime() >= 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={bill.id}
                    className="group bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    {/* Header: Bill #, Short ID, Dining Badge */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-sm text-foreground">
                            Bill #{billNumber}
                          </span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                            #{bill.id.slice(0, 8)}
                          </span>
                        </div>

                        {bill.order_type === 'DINE_IN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                            <Utensils className="h-2.5 w-2.5" />
                            Dine In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
                            <ShoppingBag className="h-2.5 w-2.5" />
                            Takeaway
                          </span>
                        )}
                      </div>

                      {/* Date & Elapsed Time */}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {format(
                            new Date(bill.created_at),
                            isOlderThan24h ? 'dd MMM, HH:mm' : 'HH:mm'
                          )}{' '}
                          • {getElapsedDisplay(bill.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Strip: Table & Staff */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {tableName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20 text-[11px]">
                          <Utensils className="h-2.5 w-2.5" />
                          {tableName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-medium text-[11px]">
                          Direct counter
                        </span>
                      )}

                      {staffName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/70 text-muted-foreground text-[11px] truncate max-w-[130px]">
                          <User className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{staffName}</span>
                        </span>
                      )}
                    </div>

                    {/* Items Preview */}
                    {items && items.length > 0 && (
                      <div className="rounded-xl bg-muted/40 p-2.5 text-xs space-y-1 border border-border/40">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="truncate text-foreground/90 font-medium">
                              <span className="font-bold text-primary mr-1">{item.quantity}x</span>
                              {item.item?.name || item.item_name || 'Item'}
                            </span>
                            <span className="font-mono text-muted-foreground font-medium text-[11px]">
                              ₹{(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {items.length > 2 && (
                          <p className="text-[10px] text-muted-foreground font-semibold pt-0.5">
                            +{items.length - 2} more {items.length - 2 === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Payment Badge, Amount Due, View Bill Button */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {getPaymentBadge(bill.payment_method)}
                        </div>
                        <div className="font-mono text-base sm:text-lg font-black text-foreground">
                          ₹{(Number(bill.total) || 0).toFixed(2)}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleViewBill(bill)}
                        className="h-8.5 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Bill</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 6. Dense Desktop Table View */}
        {viewMode === 'table' && (
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/70 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[80px] font-semibold text-xs">Bill #</TableHead>
                    <TableHead className="w-[110px] font-semibold text-xs">Order ID</TableHead>
                    <TableHead className="w-[110px] font-semibold text-xs">Type</TableHead>
                    <TableHead className="w-[110px] font-semibold text-xs">Table</TableHead>
                    <TableHead className="w-[130px] font-semibold text-xs">Payment</TableHead>
                    <TableHead className="w-[110px] font-semibold text-xs">Amount</TableHead>
                    <TableHead className="w-[160px] font-semibold text-xs">Date & Time</TableHead>
                    <TableHead className="w-[130px] font-semibold text-xs">Staff</TableHead>
                    <TableHead className="text-right w-[110px] font-semibold text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-foreground text-sm">No bills found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Try relaxing your search or filters.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBills.map((bill, index) => {
                      const billNumber = filteredBills.length - (startIndex + index);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const tableName = (bill as any).tables?.name || (bill as any).table?.name || '-';
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const staffName = (bill as any).users?.name || (bill as any).user?.name || '-';

                      return (
                        <TableRow
                          key={bill.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-bold text-xs">
                            #{billNumber}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{bill.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {bill.order_type === 'DINE_IN' ? (
                              <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5">
                                Dine In
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-semibold">
                                Takeaway
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {tableName}
                          </TableCell>
                          <TableCell>
                            {getPaymentBadge(bill.payment_method)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-black text-foreground">
                            ₹{(Number(bill.total) || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(bill.created_at), 'dd/MM/yy HH:mm')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                            {staffName}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewBill(bill)}
                              className="h-7.5 px-2.5 text-xs font-semibold rounded-lg border-border/70 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* 7. Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(endIndex, filteredBills.length)}</span> of{' '}
              <span className="font-semibold text-foreground">{filteredBills.length}</span> bills
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/60 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                <span>Prev</span>
              </Button>

              <div className="h-8 px-3 rounded-xl bg-muted/60 border border-border/60 text-xs font-semibold flex items-center text-foreground">
                Page {safeCurrentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/60 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Direct Thermal Bill Modal with WhatsApp Share */}
      {selectedBill && (
        <BillModal
          order={selectedBill}
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          readOnly={true}
        />
      )}
    </>
  );
}
