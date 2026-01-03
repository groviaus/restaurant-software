'use client';

import { useState } from 'react';
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
import { Receipt, Eye, Search, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { BillModal } from '@/components/billing/BillModal';
import { format } from 'date-fns';

interface BillsTableProps {
  bills: OrderWithItems[];
  outletId: string;
}

export function BillsTable({ bills }: BillsTableProps) {
  const router = useRouter();
  const [selectedBill, setSelectedBill] = useState<OrderWithItems | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter bills based on search query
  const filteredBills = bills.filter((bill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.id.toLowerCase().includes(query) ||
      bill.table?.name?.toLowerCase().includes(query) ||
      bill.user?.name?.toLowerCase().includes(query) ||
      bill.order_type.toLowerCase().includes(query)
    );
  });

  const handleViewBill = (bill: OrderWithItems) => {
    setSelectedBill(bill);
    setBillModalOpen(true);
  };

  const handleReprint = (bill: OrderWithItems) => {
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
          </div>
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
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          {searchQuery ? 'No bills found matching your search' : 'No bills found'}
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
                  filteredBills.map((bill, index) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        #{totalBills - index}
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
                        {bill.table?.name || '-'}
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
                      <TableCell className="text-xs sm:text-sm max-w-[120px] truncate">{bill.user?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewBill(bill)}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="View bill"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReprint(bill)}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Reprint receipt"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
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



