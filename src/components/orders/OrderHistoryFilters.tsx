'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatus, PaymentMethod, Table } from '@/lib/types';
import {
  Search,
  X,
  Filter,
  Calendar,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Utensils,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'all' | 'custom';

export interface OrderHistoryFilters {
  startDate?: string;
  endDate?: string;
  statuses: OrderStatus[];
  orderTypes: ('DINE_IN' | 'TAKEAWAY')[];
  paymentMethods: PaymentMethod[];
  tableId?: string;
  datePreset?: DatePreset;
}

export function getDateRangeForPreset(preset: DatePreset): { startDate?: string; endDate?: string } {
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today': {
      const d = formatYMD(today);
      return { startDate: d, endDate: d };
    }
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = formatYMD(y);
      return { startDate: d, endDate: d };
    }
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { startDate: formatYMD(start), endDate: formatYMD(today) };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { startDate: formatYMD(start), endDate: formatYMD(today) };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatYMD(start), endDate: formatYMD(today) };
    }
    case 'all': {
      return { startDate: undefined, endDate: undefined };
    }
    case 'custom':
    default:
      return {};
  }
}

interface OrderHistoryFiltersProps {
  tables: Table[];
  filters: OrderHistoryFilters;
  onFiltersChange: (filters: OrderHistoryFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalFilteredCount: number;
  totalOrdersCount: number;
}

export function OrderHistoryFilters({
  tables,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  totalFilteredCount,
  totalOrdersCount,
}: OrderHistoryFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activePreset = filters.datePreset || '30d';

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      onFiltersChange({
        ...filters,
        datePreset: 'custom',
      });
      return;
    }

    const { startDate, endDate } = getDateRangeForPreset(preset);
    onFiltersChange({
      ...filters,
      datePreset: preset,
      startDate,
      endDate,
    });
  };

  const handleStatusToggle = (status: OrderStatus) => {
    const isSelected = filters.statuses.includes(status);
    const newStatuses = isSelected
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleOrderTypeToggle = (type: 'DINE_IN' | 'TAKEAWAY') => {
    const isSelected = filters.orderTypes.includes(type);
    const newTypes = isSelected
      ? filters.orderTypes.filter((t) => t !== type)
      : [...filters.orderTypes, type];
    onFiltersChange({ ...filters, orderTypes: newTypes });
  };

  const handlePaymentMethodToggle = (method: PaymentMethod) => {
    const isSelected = filters.paymentMethods.includes(method);
    const newMethods = isSelected
      ? filters.paymentMethods.filter((m) => m !== method)
      : [...filters.paymentMethods, method];
    onFiltersChange({ ...filters, paymentMethods: newMethods });
  };

  const handleTableChange = (tableId: string) => {
    onFiltersChange({
      ...filters,
      tableId: tableId === 'all' ? undefined : tableId,
    });
  };

  const handleClearAll = () => {
    const { startDate, endDate } = getDateRangeForPreset('30d');
    onFiltersChange({
      datePreset: '30d',
      startDate,
      endDate,
      statuses: [],
      orderTypes: [],
      paymentMethods: [],
      tableId: undefined,
    });
    onSearchChange('');
  };

  const activeFiltersCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.orderTypes.length > 0 ? 1 : 0) +
    (filters.paymentMethods.length > 0 ? 1 : 0) +
    (filters.tableId ? 1 : 0) +
    (filters.datePreset === 'custom' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const selectedTable = tables.find((t) => t.id === filters.tableId);

  return (
    <div className="space-y-3">
      {/* Search & Presets Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
        {/* Omni-Search Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Order ID, dish, table, staff..."
            className="pl-9 pr-9 h-9.5 text-xs sm:text-sm bg-card rounded-xl border-border/70 focus-visible:ring-primary/20 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date Preset Pill Carousel */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7d', label: 'Last 7D' },
            { id: '30d', label: 'Last 30D' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id as DatePreset)}
                className={cn(
                  'h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {preset.id === 'custom' && <Calendar className="h-3 w-3" />}
                <span>{preset.label}</span>
              </button>
            );
          })}

          {/* Filter Toggle Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={cn(
              'h-8 px-3 text-xs font-semibold rounded-lg ml-auto lg:ml-1 cursor-pointer flex items-center gap-1.5 transition-all',
              isDrawerOpen || activeFiltersCount > 0
                ? 'border-primary/50 text-foreground bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-4.5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform duration-200', isDrawerOpen && 'rotate-180')}
            />
          </Button>
        </div>
      </div>

      {/* Custom Date Range Inline Row (When 'custom' preset is selected) */}
      {activePreset === 'custom' && (
        <div className="p-3 bg-card border border-border/70 rounded-xl flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground min-w-[36px]">From:</span>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  startDate: e.target.value,
                  datePreset: 'custom',
                })
              }
              className="h-8 text-xs w-full sm:w-38 bg-background"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground min-w-[36px]">To:</span>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  endDate: e.target.value,
                  datePreset: 'custom',
                })
              }
              className="h-8 text-xs w-full sm:w-38 bg-background"
            />
          </div>
          <p className="text-[11px] text-muted-foreground italic sm:ml-auto">
            Showing orders created within this custom date window.
          </p>
        </div>
      )}

      {/* Expandable Advanced Filters Ribbon */}
      {isDrawerOpen && (
        <div className="p-3.5 sm:p-4 bg-card border border-border/70 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Order Status
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, statuses: [] })}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer',
                    filters.statuses.length === 0
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(OrderStatus.COMPLETED)}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.statuses.includes(OrderStatus.COMPLETED)
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Completed</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(OrderStatus.CANCELLED)}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.statuses.includes(OrderStatus.CANCELLED)
                      ? 'bg-rose-600 text-white font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <XCircle className="h-3 w-3" />
                  <span>Cancelled</span>
                </button>
              </div>
            </div>

            {/* Order Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Order Type
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, orderTypes: [] })}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer',
                    filters.orderTypes.length === 0
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderTypeToggle('DINE_IN')}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.orderTypes.includes('DINE_IN')
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Utensils className="h-3 w-3" />
                  <span>Dine-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderTypeToggle('TAKEAWAY')}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.orderTypes.includes('TAKEAWAY')
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Takeaway</span>
                </button>
              </div>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Payment Method
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, paymentMethods: [] })}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer',
                    filters.paymentMethods.length === 0
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodToggle(PaymentMethod.UPI)}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.paymentMethods.includes(PaymentMethod.UPI)
                      ? 'bg-violet-600 text-white font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <QrCode className="h-3 w-3" />
                  <span>UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodToggle(PaymentMethod.CASH)}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.paymentMethods.includes(PaymentMethod.CASH)
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Banknote className="h-3 w-3" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodToggle(PaymentMethod.CARD)}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5',
                    filters.paymentMethods.includes(PaymentMethod.CARD)
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <CreditCard className="h-3 w-3" />
                  <span>Card</span>
                </button>
              </div>
            </div>

            {/* Table Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Table Filter
              </label>
              <Select
                value={filters.tableId || 'all'}
                onValueChange={handleTableChange}
              >
                <SelectTrigger className="h-7 text-xs w-full bg-background border-border/70">
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {tables.map((tbl) => (
                    <SelectItem key={tbl.id} value={tbl.id}>
                      {tbl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground text-[11px]">
              Showing <span className="font-semibold text-foreground">{totalFilteredCount}</span> of {totalOrdersCount} orders
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Active:</span>

          {searchQuery && (
            <Badge variant="secondary" className="text-[11px] h-6 px-2 gap-1 rounded-md font-normal">
              <span>&quot;{searchQuery}&quot;</span>
              <button onClick={() => onSearchChange('')} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.statuses.map((st) => (
            <Badge
              key={st}
              variant="secondary"
              className={cn(
                'text-[11px] h-6 px-2 gap-1 rounded-md font-normal',
                st === OrderStatus.COMPLETED ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'
              )}
            >
              <span>{st}</span>
              <button onClick={() => handleStatusToggle(st)} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.orderTypes.map((ot) => (
            <Badge key={ot} variant="secondary" className="text-[11px] h-6 px-2 gap-1 rounded-md font-normal">
              <span>{ot === 'DINE_IN' ? 'Dine-In' : 'Takeaway'}</span>
              <button onClick={() => handleOrderTypeToggle(ot)} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.paymentMethods.map((pm) => (
            <Badge key={pm} variant="secondary" className="text-[11px] h-6 px-2 gap-1 rounded-md font-normal">
              <span>{pm}</span>
              <button onClick={() => handlePaymentMethodToggle(pm)} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedTable && (
            <Badge key={selectedTable.id} variant="secondary" className="text-[11px] h-6 px-2 gap-1 rounded-md font-normal">
              <span>Table: {selectedTable.name}</span>
              <button onClick={() => handleTableChange('all')} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <button
            onClick={handleClearAll}
            className="text-[11px] text-primary hover:underline ml-1 cursor-pointer font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
