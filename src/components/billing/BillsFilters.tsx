'use client';

import { useState, useEffect } from 'react';
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
import { PaymentMethod, Table } from '@/lib/types';
import {
  RotateCcw,
  SlidersHorizontal,
  Banknote,
  QrCode,
  CreditCard,
  Utensils,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type BillDatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom' | 'all';

export interface BillsFilters {
  datePreset: BillDatePreset;
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

  const updateFilter = <K extends keyof BillsFilters>(key: K, value: BillsFilters[K]) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    const orderTypes = localFilters.orderTypes.includes(type)
      ? localFilters.orderTypes.filter((t) => t !== type)
      : [...localFilters.orderTypes, type];
    updateFilter('orderTypes', orderTypes);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const methods = localFilters.paymentMethods.includes(method)
      ? localFilters.paymentMethods.filter((m) => m !== method)
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
    (localFilters.minAmount !== undefined && localFilters.minAmount > 0 ? 1 : 0) +
    (localFilters.maxAmount !== undefined && localFilters.maxAmount > 0 ? 1 : 0);

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <Banknote className="h-3.5 w-3.5 mr-1" />;
      case PaymentMethod.UPI:
        return <QrCode className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />;
      case PaymentMethod.CARD:
        return <CreditCard className="h-3.5 w-3.5 mr-1 text-sky-600 dark:text-sky-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Reset */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter Invoices & Bills
          </span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
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
        {/* 1. Date Range Preset */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
          <Select
            value={localFilters.datePreset}
            onValueChange={(value) => updateFilter('datePreset', value as BillDatePreset)}
          >
            <SelectTrigger className="w-full h-8.5 rounded-xl border-border/60 bg-background/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 bg-popover/95 backdrop-blur-md">
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="yesterday" className="text-xs">Yesterday</SelectItem>
              <SelectItem value="thisWeek" className="text-xs">This Week</SelectItem>
              <SelectItem value="thisMonth" className="text-xs">This Month</SelectItem>
              <SelectItem value="lastMonth" className="text-xs">Last Month</SelectItem>
              <SelectItem value="custom" className="text-xs">Custom Range</SelectItem>
              <SelectItem value="all" className="text-xs">All Time</SelectItem>
            </SelectContent>
          </Select>
          {localFilters.datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
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

        {/* 2. Dining Type Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Dining Type</Label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => toggleOrderType('DINE_IN')}
              className={cn(
                'flex-1 h-8.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                localFilters.orderTypes.includes('DINE_IN')
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background/80 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Utensils className="h-3 w-3" />
              <span>Dine In</span>
            </button>
            <button
              type="button"
              onClick={() => toggleOrderType('TAKEAWAY')}
              className={cn(
                'flex-1 h-8.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                localFilters.orderTypes.includes('TAKEAWAY')
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background/80 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <ShoppingBag className="h-3 w-3" />
              <span>Takeaway</span>
            </button>
          </div>
        </div>

        {/* 3. Payment Method Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(PaymentMethod).map((method) => {
              const isSelected = localFilters.paymentMethods.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => togglePaymentMethod(method)}
                  className={cn(
                    'h-8.5 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-all cursor-pointer',
                    isSelected
                      ? 'bg-foreground text-background border-foreground shadow-xs'
                      : 'bg-background/80 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  {getPaymentIcon(method)}
                  <span>{method}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Table & Amount Range */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Table & Amount</Label>
          <div className="space-y-2">
            <Select
              value={localFilters.tableId || 'all'}
              onValueChange={(value) => updateFilter('tableId', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full h-8.5 rounded-xl border-border/60 bg-background/80 text-xs">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 bg-popover/95 backdrop-blur-md">
                <SelectItem value="all" className="text-xs">All Tables</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id} className="text-xs">
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                placeholder="Min ₹"
                value={localFilters.minAmount ?? ''}
                onChange={(e) =>
                  updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-xs rounded-lg border-border/60"
              />
              <Input
                type="number"
                placeholder="Max ₹"
                value={localFilters.maxAmount ?? ''}
                onChange={(e) =>
                  updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-xs rounded-lg border-border/60"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
