'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrderStatus, Table as TableType, PaymentMethod, Order } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BillModal } from '@/components/billing/BillModal';
import { OrderForm } from '@/components/forms/OrderForm';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import {
  Plus,
  Eye,
  X,
  Filter,
  Pencil,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  Flame,
  Bell,
  CheckCircle2,
  Receipt,
  Utensils,
  ShoppingBag,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTableOrderStore } from '@/store/tableOrderStore';
import { OrdersFilters, OrdersFilters as FiltersType } from '@/components/orders/OrdersFilters';
import { usePermissions } from '@/hooks/usePermissions';
import { useRealtimeOrders } from '@/hooks/useRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateOrderStatusMutation } from '@/hooks/mutations/useOrderMutations';
import { cn } from '@/lib/utils';

export interface OrderItemRecord {
  id?: string;
  item_id?: string;
  quantity: number;
  quantity_type?: string | null;
  price: number;
  notes?: string | null;
  item?: { name: string };
  item_name?: string;
}

export interface OrderRecord extends Omit<Order, 'payment_method'> {
  payment_method?: PaymentMethod | string | null;
  tables?: TableType | null;
  table?: TableType | null;
  order_items?: OrderItemRecord[];
  items?: OrderItemRecord[];
  users?: { name: string; email: string } | null;
  user?: { name: string; email: string } | null;
}

interface OrdersTableProps {
  orders: OrderRecord[];
  outletId: string;
  tables: TableType[];
  onRefresh?: () => void;
}

type StatusTab = 'ACTIVE' | 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'ALL';
type OrderTypeFilter = 'ALL' | 'DINE_IN' | 'TAKEAWAY';

export function OrdersTable({
  orders: initialOrders,
  outletId,
  tables: initialTables,
  onRefresh,
}: OrdersTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateOrderStatusMutation = useUpdateOrderStatusMutation();
  const {
    orders: storeOrders,
    tables: storeTables,
    setOrders,
    setTables,
  } = useTableOrderStore();

  // Dialog & Modal States
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<OrderRecord | null>(null);

  // Time state to satisfy React 19 purity rules & auto-refresh timers
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Operational Filters & UI States
  const [statusTab, setStatusTab] = useState<StatusTab>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resto_orders_view_mode');
        if (saved === 'table' || saved === 'grid') return saved;
      } catch {
        // ignore
      }
    }
    return 'grid';
  });

  const [filters, setFilters] = useState<FiltersType>({
    datePreset: 'today',
    statuses: [],
    orderTypes: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  const { checkPermission, isAdmin } = usePermissions();
  const canCreateOrder = isAdmin || checkPermission('orders', 'create');
  const canEditOrder = isAdmin || checkPermission('orders', 'edit');

  const canEditThisOrder = (order: OrderRecord) => {
    return canEditOrder && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED;
  };

  // Sync viewMode to localStorage
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('resto_orders_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Sync store with incoming data
  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrders(initialOrders as unknown as Order[]);
    }
    if (initialTables && initialTables.length > 0) {
      setTables(initialTables);
    }
  }, [initialOrders, initialTables, setOrders, setTables]);

  const allOrders: OrderRecord[] = (storeOrders.length > 0 ? storeOrders : initialOrders) as OrderRecord[];
  const tables = storeTables.length > 0 ? storeTables : initialTables;

  const refetchOrders = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    if (onRefresh) onRefresh();
  }, [queryClient, onRefresh]);

  // Realtime order subscription
  useRealtimeOrders({
    outletId,
    onChange: () => {
      refetchOrders();
      router.refresh();
    },
    onInsert: () => {
      refetchOrders();
      router.refresh();
    },
    onUpdate: () => {
      refetchOrders();
      router.refresh();
    },
  });

  // Calculate Date Ranges
  const getDateRange = (preset: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = now.getMonth();
    const localDate = now.getDate();

    switch (preset) {
      case 'today': {
        const start = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'yesterday': {
        const start = new Date(localYear, localMonth, localDate - 1, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'last7days': {
        const start = new Date(localYear, localMonth, localDate - 6, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'last30days': {
        const start = new Date(localYear, localMonth, localDate - 29, 0, 0, 0, 0);
        const end = new Date(localYear, localMonth, localDate + 1, 0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      }
      case 'custom': {
        if (customStart && customEnd) {
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          return { start: start.toISOString(), end: end.toISOString() };
        }
        return null;
      }
      default:
        return null;
    }
  };

  // Status Tab Counts
  const tabCounts = useMemo(() => {
    const active = allOrders.filter((o) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).length;
    const newCount = allOrders.filter((o) => o.status === OrderStatus.NEW).length;
    const preparing = allOrders.filter((o) => o.status === OrderStatus.PREPARING).length;
    const ready = allOrders.filter((o) => o.status === OrderStatus.READY).length;
    const served = allOrders.filter((o) => o.status === OrderStatus.SERVED).length;
    const completed = allOrders.filter((o) => o.status === OrderStatus.COMPLETED).length;

    return {
      ACTIVE: active,
      NEW: newCount,
      PREPARING: preparing,
      READY: ready,
      SERVED: served,
      COMPLETED: completed,
      ALL: allOrders.length,
    };
  }, [allOrders]);

  // Comprehensive Filter Pipeline
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // 1. Status Tab Filter
      if (statusTab === 'ACTIVE') {
        if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
          return false;
        }
      } else if (statusTab !== 'ALL') {
        if (order.status !== statusTab) {
          return false;
        }
      }

      // 2. Order Type Quick Filter
      if (orderTypeFilter !== 'ALL' && order.order_type !== orderTypeFilter) {
        return false;
      }

      // 3. Instant Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id?.toLowerCase().includes(q);
        const matchesTable = order.tables?.name?.toLowerCase().includes(q);
        const matchesType = order.order_type?.toLowerCase().includes(q);
        const matchesItems = order.order_items?.some((item: OrderItemRecord) =>
          (item.item?.name || item.item_name || '').toLowerCase().includes(q)
        );
        if (!matchesId && !matchesTable && !matchesType && !matchesItems) {
          return false;
        }
      }

      // 4. Drawer Filters: Date Range
      const dateRange = getDateRange(filters.datePreset, filters.customStartDate, filters.customEndDate);
      if (dateRange) {
        const orderDate = new Date(order.created_at);
        if (orderDate < new Date(dateRange.start) || orderDate >= new Date(dateRange.end)) {
          return false;
        }
      }

      // 5. Drawer Filters: Statuses
      if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
        return false;
      }

      // 6. Drawer Filters: Order Types
      if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(order.order_type)) {
        return false;
      }

      // 7. Drawer Filters: Table ID
      if (filters.tableId && order.table_id !== filters.tableId) {
        return false;
      }

      return true;
    });
  }, [allOrders, statusTab, orderTypeFilter, searchQuery, filters]);

  // Elapsed Time Helpers
  const getElapsedMinutes = (dateString: string) => {
    const diffMs = currentTime - new Date(dateString).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hours}h ${rem}m ago`;
  };

  const getUrgency = (dateString: string, status: OrderStatus) => {
    if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) return 'normal';
    const diffMs = currentTime - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins >= 25) return 'critical';
    if (mins >= 12) return 'warning';
    return 'normal';
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case OrderStatus.PREPARING:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case OrderStatus.READY:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case OrderStatus.SERVED:
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case OrderStatus.COMPLETED:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      case OrderStatus.CANCELLED:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border/60';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW:
        return <Sparkles className="h-3 w-3 animate-pulse text-sky-500" />;
      case OrderStatus.PREPARING:
        return <Flame className="h-3 w-3 text-amber-500" />;
      case OrderStatus.READY:
        return <Bell className="h-3 w-3 text-emerald-500" />;
      case OrderStatus.SERVED:
        return <CheckCircle2 className="h-3 w-3 text-violet-500" />;
      default:
        return null;
    }
  };

  // Handlers
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, status: newStatus });
      router.refresh();
    } catch {
      // Toast handled in mutation
    }
  };

  const handleBill = (order: OrderRecord) => {
    setSelectedOrder(order);
    setBillModalOpen(true);
  };

  const handleViewDetails = (order: OrderRecord) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleEditOrder = (order: OrderRecord) => {
    setOrderToEdit(order);
    setOrderFormOpen(true);
  };

  const handleCancelClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  // Primary status advancement button
  const renderPrimaryActionButton = (order: OrderRecord, className = '') => {
    if (order.status === OrderStatus.NEW) {
      return (
        <Button
          size="sm"
          onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
          className={cn(
            'h-8.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer',
            className
          )}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Start Preparing</span>
        </Button>
      );
    }
    if (order.status === OrderStatus.PREPARING) {
      return (
        <Button
          size="sm"
          onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
          className={cn(
            'h-8.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer',
            className
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Mark Ready</span>
        </Button>
      );
    }
    if (order.status === OrderStatus.READY) {
      return (
        <Button
          size="sm"
          onClick={() => handleStatusUpdate(order.id, OrderStatus.SERVED)}
          className={cn(
            'h-8.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer',
            className
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Mark Served</span>
        </Button>
      );
    }
    if (order.status === OrderStatus.SERVED) {
      return (
        <Button
          size="sm"
          onClick={() => handleBill(order)}
          className={cn(
            'h-8.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer',
            className
          )}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Generate Bill</span>
        </Button>
      );
    }
    if (order.status === OrderStatus.COMPLETED) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBill(order)}
          className={cn(
            'h-8.5 text-xs font-medium rounded-lg border-border/60 hover:bg-muted/80 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer',
            className
          )}
        >
          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
          <span>View Bill</span>
        </Button>
      );
    }
    return null;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Top Control Ribbon: Search + Order Type + View Toggle + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card/60 p-2.5 sm:p-3 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, table, item name..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-border/60 bg-background/80 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Controls Cluster */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Order Type Filter Segment */}
            <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setOrderTypeFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                  orderTypeFilter === 'ALL'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setOrderTypeFilter('DINE_IN')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                  orderTypeFilter === 'DINE_IN'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Dine-In
              </button>
              <button
                type="button"
                onClick={() => setOrderTypeFilter('TAKEAWAY')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                  orderTypeFilter === 'TAKEAWAY'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Takeaway
              </button>
            </div>

            {/* View Mode Toggle (Cards vs Table) */}
            <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={cn(
                  'h-7 w-7 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Operations Ticket Grid"
                aria-label="Ticket Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={cn(
                  'h-7 w-7 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Dense Table View"
                aria-label="Dense Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter Drawer Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'h-9 px-2.5 sm:px-3 text-xs font-medium rounded-xl border-border/60 transition-all active:scale-95 cursor-pointer',
                showFilters && 'bg-muted/80 border-border'
              )}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <span>Filters</span>
            </Button>

            {/* Create Order Button */}
            {canCreateOrder && (
              <Button
                onClick={() => setOrderFormOpen(true)}
                className="h-9 px-3 sm:px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all active:scale-95 cursor-pointer flex-shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span>New Order</span>
              </Button>
            )}
          </div>
        </div>

        {/* Status Pipeline Tabs (1-Click Filtering) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ACTIVE', label: 'Active', count: tabCounts.ACTIVE },
            { id: 'NEW', label: 'New', count: tabCounts.NEW, alert: tabCounts.NEW > 0 },
            { id: 'PREPARING', label: 'Preparing', count: tabCounts.PREPARING },
            { id: 'READY', label: 'Ready', count: tabCounts.READY },
            { id: 'SERVED', label: 'Served', count: tabCounts.SERVED },
            { id: 'COMPLETED', label: 'Completed', count: tabCounts.COMPLETED },
            { id: 'ALL', label: 'All', count: tabCounts.ALL },
          ].map((tab) => {
            const isSelected = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id as StatusTab)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs border',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-xs'
                    : 'bg-card/70 text-muted-foreground border-border/60 hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {tab.alert && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                  </span>
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-md font-mono text-[10px]',
                    isSelected
                      ? 'bg-background/20 text-background'
                      : 'bg-muted/80 text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Drawer Filters */}
        {showFilters && (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
            <OrdersFilters
              tables={tables}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {/* Results Counter Sub-header */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            Showing <strong className="font-semibold text-foreground">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'order' : 'orders'}
          </span>
          {(searchQuery || statusTab !== 'ACTIVE' || orderTypeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusTab('ACTIVE');
                setOrderTypeFilter('ALL');
              }}
              className="text-primary hover:underline cursor-pointer font-medium"
            >
              Reset active filters
            </button>
          )}
        </div>

        {/* Orders Display: Grid View vs Table View */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mx-auto">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No orders found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No orders match the current status or search query. Try switching status tabs or clear your search.
            </p>
            {canCreateOrder && (
              <Button
                size="sm"
                onClick={() => setOrderFormOpen(true)}
                className="mt-2 text-xs font-semibold rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create New Order
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Card Grid View (Operations Ticket View) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredOrders.map((order) => {
              const urgency = getUrgency(order.created_at, order.status);
              return (
                <div
                  key={order.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card/80 p-4 shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-border hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Card Top: Order ID + Status + Table */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-sm font-bold text-foreground">
                            #{order.id.slice(0, 8)}
                          </span>
                          {order.order_type === 'DINE_IN' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              <Utensils className="h-2.5 w-2.5" />
                              {order.tables?.name || 'Dine-In'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
                              <ShoppingBag className="h-2.5 w-2.5" />
                              Takeaway
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(order.created_at), 'HH:mm')} • {getElapsedMinutes(order.created_at)}
                        </span>
                      </div>

                      <Badge
                        className={cn(
                          'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 border shadow-2xs flex-shrink-0',
                          getStatusBadgeStyle(order.status)
                        )}
                      >
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </Badge>
                    </div>

                    {/* Urgency indicator banner if wait time is critical */}
                    {urgency === 'critical' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>High wait time (&gt; 25m)</span>
                      </div>
                    )}

                    {/* Items snippet preview */}
                    <div className="rounded-xl bg-muted/40 p-2.5 text-xs space-y-1.5 border border-border/40">
                      {order.order_items && order.order_items.length > 0 ? (
                        <>
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                            {order.order_items.slice(0, 3).map((item: OrderItemRecord, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="truncate text-foreground/90 font-medium">
                                  <span className="font-bold text-primary mr-1.5">{item.quantity}x</span>
                                  {item.item?.name || item.item_name || 'Item'}
                                </span>
                                <span className="font-mono text-muted-foreground ml-2 text-[11px] flex-shrink-0">
                                  ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {order.order_items.length > 3 && (
                            <p className="text-[10px] text-muted-foreground font-medium pt-0.5">
                              +{order.order_items.length - 3} more items...
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">No item details loaded</p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Total + Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-border/50 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Amount Due</span>
                      <span className="font-mono text-base font-bold text-foreground">
                        ₹{(Number(order.total) || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Primary Single-Tap Next Action Button */}
                      {renderPrimaryActionButton(order, 'flex-1')}

                      {/* Secondary Action: View Details */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleViewDetails(order)}
                        className="h-8.5 w-8.5 rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer shadow-2xs flex-shrink-0"
                        title="View Order Details"
                        aria-label="View Order Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {/* Secondary Action: Edit */}
                      {canEditThisOrder(order) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditOrder(order)}
                          className="h-8.5 w-8.5 rounded-lg border border-border/60 bg-card text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 cursor-pointer shadow-2xs flex-shrink-0"
                          title="Edit Order"
                          aria-label="Edit Order"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Secondary Action: Cancel */}
                      {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCancelClick(order.id)}
                          className="h-8.5 w-8.5 rounded-lg border border-border/60 bg-card text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer shadow-2xs flex-shrink-0"
                          title="Cancel Order"
                          aria-label="Cancel Order"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Dense Table View (Management / Audit View) */
          <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden shadow-2xs backdrop-blur-md">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/60">
                    <TableHead className="min-w-[100px] text-xs font-semibold uppercase tracking-wider">Order ID</TableHead>
                    <TableHead className="min-w-[80px] text-xs font-semibold uppercase tracking-wider">Type</TableHead>
                    <TableHead className="min-w-[80px] text-xs font-semibold uppercase tracking-wider">Table</TableHead>
                    <TableHead className="min-w-[110px] text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="min-w-[90px] text-xs font-semibold uppercase tracking-wider">Total</TableHead>
                    <TableHead className="min-w-[140px] text-xs font-semibold uppercase tracking-wider">Placed At</TableHead>
                    <TableHead className="text-right min-w-[200px] text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          {order.order_type === 'DINE_IN' ? (
                            <>
                              <Utensils className="h-3 w-3 text-muted-foreground" />
                              <span>Dine-In</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                              <span>Takeaway</span>
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {order.tables?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] font-semibold px-2 py-0.5 border shadow-2xs', getStatusBadgeStyle(order.status))}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        ₹{(Number(order.total) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(order.created_at), 'dd/MM HH:mm')} ({getElapsedMinutes(order.created_at)})
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {renderPrimaryActionButton(order, 'h-7.5 px-2.5 text-xs')}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(order)}
                            className="h-7.5 w-7.5 p-0 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {canEditThisOrder(order) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditOrder(order)}
                              className="h-7.5 w-7.5 p-0 rounded-lg border border-border/50 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 cursor-pointer"
                              title="Edit Order"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelClick(order.id)}
                              className="h-7.5 w-7.5 p-0 rounded-lg border border-border/50 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                              title="Cancel Order"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Bill & Payment Modal */}
      {selectedOrder && (
        <BillModal
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          order={selectedOrder}
          readOnly={selectedOrder.status === OrderStatus.COMPLETED}
        />
      )}

      {/* Order Create / Edit Form */}
      <OrderForm
        open={orderFormOpen}
        onOpenChange={(open) => {
          setOrderFormOpen(open);
          if (!open) {
            setOrderToEdit(null);
          }
        }}
        outletId={outletId}
        tables={tables}
        order={orderToEdit}
        onSuccess={async () => {
          const tablesRes = await fetch(`/api/tables?outlet_id=${outletId}`);
          if (tablesRes.ok) {
            const tablesData = await tablesRes.json();
            const updatedTables = tablesData.tables || tablesData || [];
            setTables(updatedTables);
          }
          const ordersRes = await fetch(`/api/orders?outlet_id=${outletId}`);
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setOrders(ordersData);
            if (selectedOrder && orderToEdit && selectedOrder.id === orderToEdit.id) {
              const updatedOrder = ordersData.find((o: OrderRecord) => o.id === selectedOrder.id);
              if (updatedOrder) {
                const fullOrderRes = await fetch(`/api/orders/${updatedOrder.id}`);
                if (fullOrderRes.ok) {
                  const fullOrder = await fullOrderRes.json();
                  setSelectedOrder(fullOrder);
                }
              }
            }
          }
          setOrderToEdit(null);
          router.refresh();
        }}
      />

      {/* Itemized Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          open={orderDetailsOpen}
          onOpenChange={setOrderDetailsOpen}
          order={selectedOrder}
        />
      )}

      {/* Order Cancellation Confirmation Dialog */}
      {orderToCancel && (
        <CancelOrderDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          orderId={orderToCancel}
          onSuccess={async () => {
            setOrderToCancel(null);
            const ordersRes = await fetch(`/api/orders?outlet_id=${outletId}`);
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              setOrders(ordersData);
            }
            router.refresh();
          }}
        />
      )}
    </>
  );
}
