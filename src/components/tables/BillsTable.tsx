'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { OrderWithItems } from '@/lib/types';
import { Eye, Search, QrCode, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { BillModal } from '@/components/billing/BillModal';
import { format } from 'date-fns';
import { useRealtimeOrders } from '@/hooks/useRealtime';
import { BillsFilters, BillsFilters as FiltersType } from '@/components/billing/BillsFilters';
import { Table as TableType } from '@/lib/types';

interface BillsTableProps {
  bills: OrderWithItems[];
  outletId: string;
  tables: TableType[];
}

const ITEMS_PER_PAGE = 15;

export function BillsTable({ bills: initialBills, outletId, tables }: BillsTableProps) {
  const router = useRouter();
  const [bills, setBills] = useState<OrderWithItems[]>(initialBills);
  const [selectedBill, setSelectedBill] = useState<OrderWithItems | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({
    datePreset: 'today',
    orderTypes: [],
    paymentMethods: [],
  });

  // Update bills when initialBills changes (e.g., from server refresh)
  useEffect(() => {
    setBills(initialBills);
    setCurrentPage(1); // Reset to first page when data changes
  }, [initialBills]);

  // Function to refetch bills from API
  const refetchBills = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders?outlet_id=${outletId}&status=COMPLETED`);
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Failed to refetch bills:', error);
    }
  }, [outletId]);

  // Subscribe to real-time order changes (bills are completed orders)
  useRealtimeOrders({
    outletId,
    onChange: (payload) => {
      // Only refetch if the change involves a completed order
      const newRecord = payload.new as any;
      if (newRecord?.status === 'COMPLETED' || payload.eventType === 'UPDATE') {
        refetchBills();
      }
    },
  });

  // Get date range from preset
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
      default:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  };

  // Apply filters
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          bill.id.toLowerCase().includes(query) ||
          (bill as any).tables?.name?.toLowerCase().includes(query) ||
          (bill as any).table?.name?.toLowerCase().includes(query) ||
          (bill as any).users?.name?.toLowerCase().includes(query) ||
          (bill as any).user?.name?.toLowerCase().includes(query) ||
          bill.order_type.toLowerCase().includes(query) ||
          bill.payment_method?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Date filter
      const dateRange = getDateRange(filters.datePreset, filters.customStartDate, filters.customEndDate);
      const billDate = new Date(bill.created_at);
      if (billDate < dateRange.start || billDate > dateRange.end) {
        return false;
      }

      // Order type filter
      if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(bill.order_type)) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethods.length > 0) {
        if (!bill.payment_method || !filters.paymentMethods.includes(bill.payment_method)) {
          return false;
        }
      }

      // Table filter
      if (filters.tableId && bill.table_id !== filters.tableId) {
        return false;
      }

      // Amount range filter
      const amount = Number(bill.total);
      if (filters.minAmount !== undefined && amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [bills, searchQuery, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const handleViewBill = (bill: OrderWithItems) => {
    setSelectedBill(bill);
    setBillModalOpen(true);
  };

  // Calculate totals for display
  const totalAmount = filteredBills.reduce((sum, bill) => sum + Number(bill.total), 0);
  const totalBills = filteredBills.length;

  return (
    <>
      <div className="space-y-4">
        {/* Search and Summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 sm:h-10"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm bg-muted/50 p-3 rounded-lg sm:bg-transparent sm:p-0">
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">{totalBills}</span> bills
            </div>
            <div className="text-muted-foreground">
              Total: <span className="font-semibold text-foreground text-sm sm:text-base">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <BillsFilters
            tables={tables}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Bills Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto text-responsive-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[60px]">Bill #</TableHead>
                  <TableHead className="min-w-[100px]">Order ID</TableHead>
                  <TableHead className="min-w-[90px]">Type</TableHead>
                  <TableHead className="min-w-[100px]">Table</TableHead>
                  <TableHead className="min-w-[130px]">Payment</TableHead>
                  <TableHead className="min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[140px]">Date & Time</TableHead>
                  <TableHead className="min-w-[120px]">Staff</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          {searchQuery || Object.keys(filters).some(k => {
                            const key = k as keyof FiltersType;
                            if (key === 'datePreset') return filters.datePreset !== 'today';
                            if (key === 'orderTypes') return filters.orderTypes.length > 0;
                            if (key === 'paymentMethods') return filters.paymentMethods.length > 0;
                            return filters[key] !== undefined && filters[key] !== '';
                          }) ? 'No bills found matching your filters' : 'No bills found'}
                        </p>
                        {!searchQuery && (
                          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Completed orders will appear here as bills. Generate bills from the Orders page.
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBills.map((bill, index) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        #{totalBills - (startIndex + index)}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] sm:text-xs">
                        {bill.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">
                          {bill.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {(bill as any).tables?.name || (bill as any).table?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit text-[10px] sm:text-xs">
                          {bill.payment_method === 'UPI' ? (
                            <>
                              <QrCode className="h-3 w-3" />
                              <span>UPI</span>
                            </>
                          ) : (
                            <span>{bill.payment_method || 'N/A'}</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs sm:text-sm text-gray-900">
                        ₹{Number(bill.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-xs whitespace-nowrap">
                        {format(new Date(bill.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm max-w-[120px] truncate">
                        {(bill as any).users?.name || (bill as any).user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBill(bill)}
                          className="text-xs"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">View Bill</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBills.length)} of {filteredBills.length} bills
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
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
