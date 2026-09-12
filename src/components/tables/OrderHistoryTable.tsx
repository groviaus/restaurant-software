'use client';

import { useState } from 'react';
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
import { OrderWithItems, OrderStatus, PaymentMethod } from '@/lib/types';
import {
  Receipt,
  Utensils,
  ShoppingBag,
  User,
  CheckCircle2,
  XCircle,
  QrCode,
  CreditCard,
  Banknote,
  SearchX,
  Eye,
} from 'lucide-react';
import { BillModal } from '@/components/billing/BillModal';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderHistoryTableProps {
  orders: OrderWithItems[];
  outletId: string;
  viewMode?: 'table' | 'card';
  onClearFilters?: () => void;
  loading?: boolean;
}

export function OrderHistoryTable({
  orders,
  viewMode = 'table',
  onClearFilters,
  loading = false,
}: OrderHistoryTableProps) {
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<OrderWithItems | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<OrderWithItems | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleOpenReceipt = (order: OrderWithItems) => {
    setSelectedOrderForBill(order);
    setBillModalOpen(true);
  };

  const handleOpenDetails = (order: OrderWithItems) => {
    setSelectedOrderForDetails(order);
    setDetailsModalOpen(true);
  };

  // Helper for item preview summary
  const getOrderItemsSummary = (order: OrderWithItems) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order as any).order_items || order.items || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalQty = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = items.map((it: any) => {
      const name = it.items?.name || it.item?.name || it.item_name || 'Item';
      const qty = Number(it.quantity) || 1;
      return qty > 1 ? `${qty}x ${name}` : name;
    });

    const summaryText = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
    return {
      totalQty,
      summaryText: summaryText || 'No item details',
      hasNotes: items.some((it: { notes?: string | null }) => Boolean(it.notes)),
    };
  };

  const getStatusBadge = (status: OrderStatus) => {
    if (status === OrderStatus.COMPLETED) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
          <CheckCircle2 className="h-3 w-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (status === OrderStatus.CANCELLED) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
          <XCircle className="h-3 w-3" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <Badge variant="secondary" className="text-[11px]">
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (method?: PaymentMethod | string | null) => {
    switch (method) {
      case PaymentMethod.UPI:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300 px-2 py-0.5 rounded-md border border-violet-200/60 dark:border-violet-800/40">
            <QrCode className="h-3 w-3 text-violet-600 dark:text-violet-400" />
            <span>UPI</span>
          </span>
        );
      case PaymentMethod.CARD:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40">
            <CreditCard className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>Card</span>
          </span>
        );
      case PaymentMethod.CASH:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
            <Banknote className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Cash</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] text-muted-foreground font-mono">
            {method || '-'}
          </span>
        );
    }
  };

  if (loading && orders.length === 0) {
    return (
      <>
        {/* Mobile / Card View Skeletons */}
        <div
          className={cn(
            'space-y-3',
            viewMode === 'card' ? 'block' : 'block md:hidden'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/70 rounded-2xl p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-44" />
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Dense Table View Skeletons */}
        <div
          className={cn(
            'rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs',
            viewMode === 'table' ? 'hidden md:block' : 'hidden'
          )}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border/70">
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[110px]">Order ID</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[130px]">Type & Table</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[220px]">Items Summary</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[110px]">Status</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[100px]">Payment</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[120px]">Billed By</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 min-w-[140px]">Date & Time</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 text-right min-w-[110px]">Total</TableHead>
                  <TableHead className="text-xs font-bold text-foreground py-3 text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/50">
                    <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="py-3 text-right"><Skeleton className="h-7 w-16 rounded-lg ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </>
    );
  }

  // Empty State Component
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center bg-card/50">
        <div className="max-w-md mx-auto space-y-3.5">
          <div className="h-12 w-12 rounded-2xl bg-muted/70 flex items-center justify-center mx-auto text-muted-foreground">
            <SearchX className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No orders match criteria</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We couldn&apos;t find any completed or cancelled orders matching your selected date range or filters.
            </p>
          </div>
          {onClearFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClearFilters}
              className="h-8 px-3 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Reset All Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. Mobile-First Card View (shown on mobile, or when viewMode === 'card') */}
      <div
        className={cn(
          'space-y-3',
          viewMode === 'card' ? 'block' : 'block md:hidden'
        )}
      >
        {orders.map((order) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tableName = (order as any).tables?.name || (order as any).table?.name;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const staffName = (order as any).users?.name || (order as any).user?.name || 'Staff';
          const { totalQty, summaryText, hasNotes } = getOrderItemsSummary(order);
          const isCompleted = order.status === OrderStatus.COMPLETED;

          return (
            <div
              key={order.id}
              onClick={() => (isCompleted ? handleOpenReceipt(order) : handleOpenDetails(order))}
              className="bg-card border border-border/70 hover:border-primary/40 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-xs transition-all cursor-pointer relative group"
            >
              {/* Top Row: ID, Status, Type, and Time */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  {getStatusBadge(order.status)}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                    {order.order_type === 'DINE_IN' ? (
                      <>
                        <Utensils className="h-3 w-3 text-primary" />
                        <span>Table {tableName || 'Dine-In'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3 w-3" />
                        <span>Takeaway</span>
                      </>
                    )}
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">
                  {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                </span>
              </div>

              {/* Middle Row: Items Summary Preview */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="font-medium">
                    {totalQty} {totalQty === 1 ? 'item' : 'items'}
                  </span>
                  {hasNotes && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium italic text-[10px]">
                      • Contains Kitchen Notes
                    </span>
                  )}
                </div>
                <p className="text-foreground text-xs line-clamp-2 leading-relaxed font-normal">
                  {summaryText}
                </p>
              </div>

              {/* Bottom Row: Payment, Staff, Total, and Action */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {getPaymentBadge(order.payment_method)}
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="max-w-[100px] truncate">{staffName}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block text-[10px] uppercase font-semibold">Total</span>
                    <span className="text-base sm:text-lg font-black font-mono text-foreground">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>

                  {isCompleted ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReceipt(order);
                      }}
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                      title="View & Share Receipt"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Receipt</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(order);
                      }}
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg border-border/70 hover:bg-muted text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Dense Table View (shown on md+ when viewMode === 'table') */}
      <div
        className={cn(
          'rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs',
          viewMode === 'table' ? 'hidden md:block' : 'hidden'
        )}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/70 hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[110px]">Order ID</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[130px]">Type & Table</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[220px]">Items Summary</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[110px]">Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[100px]">Payment</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[120px]">Billed By</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 min-w-[140px]">Date & Time</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 text-right min-w-[110px]">Total</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {orders.map((order) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tableName = (order as any).tables?.name || (order as any).table?.name;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const staffName = (order as any).users?.name || (order as any).user?.name || 'Staff';
                const { totalQty, summaryText } = getOrderItemsSummary(order);
                const isCompleted = order.status === OrderStatus.COMPLETED;

                return (
                  <TableRow
                    key={order.id}
                    onClick={() => (isCompleted ? handleOpenReceipt(order) : handleOpenDetails(order))}
                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    {/* Order ID */}
                    <TableCell className="py-3 font-mono font-bold text-xs text-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </TableCell>

                    {/* Type & Table */}
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                        {order.order_type === 'DINE_IN' ? (
                          <>
                            <Utensils className="h-3.5 w-3.5 text-primary" />
                            <span>Table {tableName || 'Dine-In'}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Takeaway</span>
                          </>
                        )}
                      </span>
                    </TableCell>

                    {/* Items Summary */}
                    <TableCell className="py-3 max-w-[240px]">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          {totalQty} {totalQty === 1 ? 'item' : 'items'}
                        </span>
                        <p className="text-xs text-foreground truncate font-normal" title={summaryText}>
                          {summaryText}
                        </p>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      {getStatusBadge(order.status)}
                    </TableCell>

                    {/* Payment */}
                    <TableCell className="py-3">
                      {getPaymentBadge(order.payment_method)}
                    </TableCell>

                    {/* Staff */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 max-w-[120px] truncate">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{staffName}</span>
                      </span>
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap font-medium">
                      {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="py-3 text-right font-mono font-black text-sm text-foreground">
                      ₹{order.total.toFixed(2)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isCompleted ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenReceipt(order)}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                            title="Print & Share Receipt to WhatsApp"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span>Receipt</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetails(order)}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-border/70 hover:bg-muted text-foreground cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bill & Receipt Modal (Configured to show thermal receipt with WhatsApp Share) */}
      {selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          readOnly={true}
        />
      )}

      {/* Order Details Audit Modal (for inspecting cancelled or completed items) */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </>
  );
}
