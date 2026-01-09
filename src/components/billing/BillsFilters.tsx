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
import { PaymentMethod } from '@/lib/types';
import { Table } from '@/lib/types';
import { X } from 'lucide-react';

export interface BillsFilters {
  datePreset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  orderTypes: ('DINE_IN' | 'TAKEAWAY')[];
  paymentMethods: PaymentMethod[];
  tableId?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface BillsFiltersProps {
  tables: Table[];
  filters: BillsFilters;
  onFiltersChange: (filters: BillsFilters) => void;
}

export function BillsFilters({ tables, filters, onFiltersChange }: BillsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<BillsFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof BillsFilters, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    const orderTypes = localFilters.orderTypes.includes(type)
      ? localFilters.orderTypes.filter(t => t !== type)
      : [...localFilters.orderTypes, type];
    updateFilter('orderTypes', orderTypes);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const methods = localFilters.paymentMethods.includes(method)
      ? localFilters.paymentMethods.filter(m => m !== method)
      : [...localFilters.paymentMethods, method];
    updateFilter('paymentMethods', methods);
  };

  const clearFilters = () => {
    const defaultFilters: BillsFilters = {
      datePreset: 'today',
      orderTypes: [],
      paymentMethods: [],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFilterCount =
    (localFilters.orderTypes.length > 0 ? 1 : 0) +
    (localFilters.paymentMethods.length > 0 ? 1 : 0) +
    (localFilters.tableId ? 1 : 0) +
    (localFilters.datePreset !== 'today' ? 1 : 0) +
    (localFilters.minAmount ? 1 : 0) +
    (localFilters.maxAmount ? 1 : 0);

  return (
    <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Preset */}
        <div className="space-y-2">
          <Label className="text-xs">Date Range</Label>
          <Select
            value={localFilters.datePreset}
            onValueChange={(value: any) => updateFilter('datePreset', value)}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {localFilters.datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                type="date"
                value={localFilters.customStartDate || ''}
                onChange={(e) => updateFilter('customStartDate', e.target.value)}
                className="h-9 text-xs"
              />
              <Input
                type="date"
                value={localFilters.customEndDate || ''}
                onChange={(e) => updateFilter('customEndDate', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          )}
        </div>

        {/* Order Type Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Order Type</Label>
          <div className="flex gap-2">
            <Button
              variant={localFilters.orderTypes.includes('DINE_IN') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleOrderType('DINE_IN')}
              className="h-9 text-xs flex-1"
            >
              Dine In
            </Button>
            <Button
              variant={localFilters.orderTypes.includes('TAKEAWAY') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleOrderType('TAKEAWAY')}
              className="h-9 text-xs flex-1"
            >
              Takeaway
            </Button>
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

        {/* Payment Method Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Payment Method</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(PaymentMethod).map((method) => (
              <Button
                key={method}
                variant={localFilters.paymentMethods.includes(method) ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePaymentMethod(method)}
                className="h-9 text-xs"
              >
                {method}
              </Button>
            ))}
          </div>
          {localFilters.paymentMethods.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {localFilters.paymentMethods.map((method) => (
                <Badge
                  key={method}
                  variant="secondary"
                  className="text-xs"
                >
                  {method}
                  <button
                    onClick={() => togglePaymentMethod(method)}
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
          <Label className="text-xs">Table</Label>
          <Select
            value={localFilters.tableId || 'all'}
            onValueChange={(value) => updateFilter('tableId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full h-9">
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

        {/* Amount Range */}
        <div className="space-y-2">
          <Label className="text-xs">Amount Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={localFilters.minAmount || ''}
              onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 text-xs"
            />
            <Input
              type="number"
              placeholder="Max"
              value={localFilters.maxAmount || ''}
              onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

