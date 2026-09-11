'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderStatus, Table } from '@/lib/types';
import { X, ChevronDown, RotateCcw } from 'lucide-react';

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom' | 'all';

export interface OrdersFilters {
  datePreset: DatePreset;
  customStartDate?: string;
  customEndDate?: string;
  statuses: OrderStatus[];
  orderTypes: ('DINE_IN' | 'TAKEAWAY')[];
  tableId?: string;
}

interface OrdersFiltersProps {
  tables: Table[];
  filters: OrdersFilters;
  onFiltersChange: (filters: OrdersFilters) => void;
}

export function OrdersFilters({ tables, filters, onFiltersChange }: OrdersFiltersProps) {
  const [localFilters, setLocalFilters] = useState<OrdersFilters>(filters);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [orderTypeSelectOpen, setOrderTypeSelectOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const orderTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusSelectOpen(false);
      }
      if (orderTypeRef.current && !orderTypeRef.current.contains(event.target as Node)) {
        setOrderTypeSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateFilter = <K extends keyof OrdersFilters>(key: K, value: OrdersFilters[K]) => {
    const prev = localFilters[key];
    if (
      prev === value ||
      (Array.isArray(prev) &&
        Array.isArray(value) &&
        prev.length === value.length &&
        prev.every((v, i) => v === value[i]))
    ) {
      return;
    }
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleStatus = (status: OrderStatus) => {
    const statuses = localFilters.statuses.includes(status)
      ? localFilters.statuses.filter((s) => s !== status)
      : [...localFilters.statuses, status];
    updateFilter('statuses', statuses);
  };

  const toggleOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    const orderTypes = localFilters.orderTypes.includes(type)
      ? localFilters.orderTypes.filter((t) => t !== type)
      : [...localFilters.orderTypes, type];
    updateFilter('orderTypes', orderTypes);
  };

  const clearFilters = () => {
    const defaultFilters: OrdersFilters = {
      datePreset: 'today',
      statuses: [],
      orderTypes: [],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setStatusSelectOpen(false);
    setOrderTypeSelectOpen(false);
  };

  const activeFilterCount =
    (localFilters.statuses.length > 0 ? 1 : 0) +
    (localFilters.orderTypes.length > 0 ? 1 : 0) +
    (localFilters.tableId ? 1 : 0) +
    (localFilters.datePreset !== 'today' ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advanced Query Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Date Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
          <Select
            value={localFilters.datePreset}
            onValueChange={(value) => updateFilter('datePreset', value as DatePreset)}
          >
            <SelectTrigger className="w-full h-8.5 rounded-xl border-border/60 bg-background/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-0 bg-popover/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="yesterday" className="text-xs">Yesterday</SelectItem>
              <SelectItem value="last7days" className="text-xs">Last 7 days</SelectItem>
              <SelectItem value="last30days" className="text-xs">Last 30 days</SelectItem>
              <SelectItem value="custom" className="text-xs">Custom Range</SelectItem>
              <SelectItem value="all" className="text-xs">All Time</SelectItem>
            </SelectContent>
          </Select>
          {localFilters.datePreset === 'custom' && (
            <div className="space-y-2 mt-2">
              <Input
                type="date"
                value={localFilters.customStartDate || ''}
                onChange={(e) => updateFilter('customStartDate', e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
              <Input
                type="date"
                value={localFilters.customEndDate || ''}
                onChange={(e) => updateFilter('customEndDate', e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Order Statuses</Label>
          <div className="relative" ref={statusRef}>
            <Button
              type="button"
              variant="outline"
              className="w-full h-8.5 justify-between rounded-xl border-border/60 bg-background/80 text-xs font-normal"
              onClick={() => setStatusSelectOpen(!statusSelectOpen)}
            >
              <span className="truncate">
                {localFilters.statuses.length > 0
                  ? `${localFilters.statuses.length} selected`
                  : 'All Statuses'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1 flex-shrink-0" />
            </Button>
            {statusSelectOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md p-1.5 shadow-lg space-y-0.5">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/80 rounded-lg transition-colors"
                  onClick={() => updateFilter('statuses', [])}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.statuses.length === 0}
                    readOnly
                    className="rounded accent-primary"
                  />
                  <span className="font-medium">All Statuses</span>
                </div>
                {Object.values(OrderStatus).map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/80 rounded-lg transition-colors"
                    onClick={() => toggleStatus(status)}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.statuses.includes(status)}
                      readOnly
                      className="rounded accent-primary"
                    />
                    <span>{status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {localFilters.statuses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {localFilters.statuses.map((status) => (
                <Badge
                  key={status}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.2 rounded-md font-medium"
                >
                  {status}
                  <button
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className="ml-1 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Order Type Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Dining Type</Label>
          <div className="relative" ref={orderTypeRef}>
            <Button
              type="button"
              variant="outline"
              className="w-full h-8.5 justify-between rounded-xl border-border/60 bg-background/80 text-xs font-normal"
              onClick={() => setOrderTypeSelectOpen(!orderTypeSelectOpen)}
            >
              <span className="truncate">
                {localFilters.orderTypes.length > 0
                  ? `${localFilters.orderTypes.length} selected`
                  : 'All Types'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1 flex-shrink-0" />
            </Button>
            {orderTypeSelectOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md p-1.5 shadow-lg space-y-0.5">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/80 rounded-lg transition-colors"
                  onClick={() => updateFilter('orderTypes', [])}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.orderTypes.length === 0}
                    readOnly
                    className="rounded accent-primary"
                  />
                  <span className="font-medium">All Types</span>
                </div>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/80 rounded-lg transition-colors"
                  onClick={() => toggleOrderType('DINE_IN')}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.orderTypes.includes('DINE_IN')}
                    readOnly
                    className="rounded accent-primary"
                  />
                  <span>Dine In</span>
                </div>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/80 rounded-lg transition-colors"
                  onClick={() => toggleOrderType('TAKEAWAY')}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.orderTypes.includes('TAKEAWAY')}
                    readOnly
                    className="rounded accent-primary"
                  />
                  <span>Takeaway</span>
                </div>
              </div>
            )}
          </div>
          {localFilters.orderTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {localFilters.orderTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.2 rounded-md font-medium"
                >
                  {type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                  <button
                    type="button"
                    onClick={() => toggleOrderType(type)}
                    className="ml-1 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Table Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Specific Table</Label>
          <Select
            value={localFilters.tableId || 'all'}
            onValueChange={(value) => updateFilter('tableId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full h-8.5 rounded-xl border-border/60 bg-background/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-0 bg-popover/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
              <SelectItem value="all" className="text-xs">All Tables</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table.id} value={table.id} className="text-xs">
                  {table.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
