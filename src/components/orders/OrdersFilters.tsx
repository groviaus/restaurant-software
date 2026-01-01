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
import { OrderStatus } from '@/lib/types';
import { Table } from '@/lib/types';
import { X, ChevronDown } from 'lucide-react';

export interface OrdersFilters {
  datePreset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';
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

  const updateFilter = (key: keyof OrdersFilters, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleStatus = (status: OrderStatus) => {
    const statuses = localFilters.statuses.includes(status)
      ? localFilters.statuses.filter(s => s !== status)
      : [...localFilters.statuses, status];
    updateFilter('statuses', statuses);
  };

  const toggleOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    const orderTypes = localFilters.orderTypes.includes(type)
      ? localFilters.orderTypes.filter(t => t !== type)
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
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeFilterCount} active</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Filter */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Select
            value={localFilters.datePreset}
            onValueChange={(value) => updateFilter('datePreset', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {localFilters.datePreset === 'custom' && (
            <div className="space-y-2 mt-2">
              <Input
                type="date"
                value={localFilters.customStartDate || ''}
                onChange={(e) => updateFilter('customStartDate', e.target.value)}
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={localFilters.customEndDate || ''}
                onChange={(e) => updateFilter('customEndDate', e.target.value)}
                placeholder="End Date"
              />
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="relative" ref={statusRef}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => setStatusSelectOpen(!statusSelectOpen)}
            >
              {localFilters.statuses.length > 0
                ? `${localFilters.statuses.length} selected`
                : 'All Statuses'}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            {statusSelectOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => {
                    updateFilter('statuses', []);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.statuses.length === 0}
                    readOnly
                    className="rounded"
                  />
                  <span>All Statuses</span>
                </div>
                {Object.values(OrderStatus).map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                    onClick={() => toggleStatus(status)}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.statuses.includes(status)}
                      readOnly
                      className="rounded"
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
                  className="text-xs"
                >
                  {status}
                  <button
                    onClick={() => toggleStatus(status)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Order Type Filter */}
        <div className="space-y-2">
          <Label>Order Type</Label>
          <div className="relative" ref={orderTypeRef}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => setOrderTypeSelectOpen(!orderTypeSelectOpen)}
            >
              {localFilters.orderTypes.length > 0
                ? `${localFilters.orderTypes.length} selected`
                : 'All Types'}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            {orderTypeSelectOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => {
                    updateFilter('orderTypes', []);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.orderTypes.length === 0}
                    readOnly
                    className="rounded"
                  />
                  <span>All Types</span>
                </div>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => toggleOrderType('DINE_IN')}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.orderTypes.includes('DINE_IN')}
                    readOnly
                    className="rounded"
                  />
                  <span>Dine In</span>
                </div>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => toggleOrderType('TAKEAWAY')}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.orderTypes.includes('TAKEAWAY')}
                    readOnly
                    className="rounded"
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
                  className="text-xs"
                >
                  {type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                  <button
                    onClick={() => toggleOrderType(type)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Table Filter */}
        <div className="space-y-2">
          <Label>Table</Label>
          <Select
            value={localFilters.tableId || 'all'}
            onValueChange={(value) => updateFilter('tableId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
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

