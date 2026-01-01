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
import { OrderStatus, PaymentMethod } from '@/lib/types';
import { Table } from '@/lib/types';
import { X, ChevronDown } from 'lucide-react';

export interface OrderHistoryFilters {
  startDate?: string;
  endDate?: string;
  statuses: OrderStatus[];
  orderTypes: ('DINE_IN' | 'TAKEAWAY')[];
  paymentMethods: PaymentMethod[];
  tableId?: string;
}

interface OrderHistoryFiltersProps {
  tables: Table[];
  filters: OrderHistoryFilters;
  onFiltersChange: (filters: OrderHistoryFilters) => void;
}

export function OrderHistoryFilters({ tables, filters, onFiltersChange }: OrderHistoryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<OrderHistoryFilters>(filters);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [orderTypeSelectOpen, setOrderTypeSelectOpen] = useState(false);
  const [paymentMethodSelectOpen, setPaymentMethodSelectOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const orderTypeRef = useRef<HTMLDivElement>(null);
  const paymentMethodRef = useRef<HTMLDivElement>(null);

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
      if (paymentMethodRef.current && !paymentMethodRef.current.contains(event.target as Node)) {
        setPaymentMethodSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateFilter = (key: keyof OrderHistoryFilters, value: any) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:updateFilter',message:'updateFilter called',data:{key,value,currentFilters:localFilters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const updated = { ...localFilters, [key]: value };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:updateFilter',message:'updated filters',data:{updatedFilters:updated},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleStatus = (status: OrderStatus) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:toggleStatus',message:'toggleStatus called',data:{status,currentStatuses:localFilters.statuses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const statuses = localFilters.statuses.includes(status)
      ? localFilters.statuses.filter(s => s !== status)
      : [...localFilters.statuses, status];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:toggleStatus',message:'new statuses array',data:{newStatuses:statuses},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    updateFilter('statuses', statuses);
  };

  const toggleOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:toggleOrderType',message:'toggleOrderType called',data:{type,currentOrderTypes:localFilters.orderTypes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const orderTypes = localFilters.orderTypes.includes(type)
      ? localFilters.orderTypes.filter(t => t !== type)
      : [...localFilters.orderTypes, type];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:toggleOrderType',message:'new orderTypes array',data:{newOrderTypes:orderTypes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    updateFilter('orderTypes', orderTypes);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:togglePaymentMethod',message:'togglePaymentMethod called',data:{method,currentPaymentMethods:localFilters.paymentMethods},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const methods = localFilters.paymentMethods.includes(method)
      ? localFilters.paymentMethods.filter(m => m !== method)
      : [...localFilters.paymentMethods, method];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f28a182b-47f0-4b96-ad1c-42d93b6e9063',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrderHistoryFilters.tsx:togglePaymentMethod',message:'new paymentMethods array',data:{newPaymentMethods:methods},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    updateFilter('paymentMethods', methods);
  };

  const clearFilters = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const defaultFilters: OrderHistoryFilters = {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      statuses: [],
      orderTypes: [],
      paymentMethods: [],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFilterCount = 
    (localFilters.statuses.length > 0 ? 1 : 0) +
    (localFilters.orderTypes.length > 0 ? 1 : 0) +
    (localFilters.paymentMethods.length > 0 ? 1 : 0) +
    (localFilters.tableId ? 1 : 0);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="space-y-2">
            <Input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              placeholder="End Date"
            />
          </div>
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
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => toggleStatus(OrderStatus.COMPLETED)}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.statuses.includes(OrderStatus.COMPLETED)}
                    readOnly
                    className="rounded"
                  />
                  <span>Completed</span>
                </div>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => toggleStatus(OrderStatus.CANCELLED)}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.statuses.includes(OrderStatus.CANCELLED)}
                    readOnly
                    className="rounded"
                  />
                  <span>Cancelled</span>
                </div>
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

        {/* Payment Method Filter */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="relative" ref={paymentMethodRef}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => setPaymentMethodSelectOpen(!paymentMethodSelectOpen)}
            >
              {localFilters.paymentMethods.length > 0
                ? `${localFilters.paymentMethods.length} selected`
                : 'All Methods'}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            {paymentMethodSelectOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={() => {
                    updateFilter('paymentMethods', []);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.paymentMethods.length === 0}
                    readOnly
                    className="rounded"
                  />
                  <span>All Methods</span>
                </div>
                {Object.values(PaymentMethod).map((method) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                    onClick={() => togglePaymentMethod(method)}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.paymentMethods.includes(method)}
                      readOnly
                      className="rounded"
                    />
                    <span>{method}</span>
                  </div>
                ))}
              </div>
            )}
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




