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
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, table, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">{totalBills}</span> bills
            </div>
            <div className="text-muted-foreground">
              Total: <span className="font-medium text-foreground">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        <p className="text-sm text-muted-foreground">
                          Completed orders will appear here as bills. Generate bills from the Orders page.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill, index) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      #{totalBills - index}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {bill.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {bill.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bill.table?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
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
                    <TableCell className="font-medium">
                      ₹{Number(bill.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(bill.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{bill.user?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewBill(bill)}
                          title="View Bill"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReprint(bill)}
                          title="Reprint Receipt"
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



