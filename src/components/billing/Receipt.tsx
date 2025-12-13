'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import { getQuantityTypeLabel, getQuantityTypeMultiplier } from '@/lib/utils/quantity';

interface ReceiptProps {
  billData: any;
  order: any;
  onClose: () => void;
}

export function Receipt({ billData, order, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <CardTitle>Receipt</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-8">
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold">Restaurant POS</h2>
              <p className="text-sm text-gray-600">Receipt</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono">{billData.order_id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(billData.created_at).toLocaleString()}</span>
              </div>
              {order.tables && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span>{order.tables.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>{billData.payment_method}</span>
              </div>
            </div>

            <div className="border-t border-b py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.items.map((item: any) => {
                    // Price is already the effective price (base_price * multiplier) stored in order_items
                    const itemPrice = Number(item.price);
                    const total = itemPrice * item.quantity;
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">
                          <div>
                            <div className="font-medium">{item.items?.name || 'Item'}</div>
                            {item.notes && (
                              <div className="text-xs text-gray-600">{item.notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-2">
                          {item.quantity_type ? getQuantityTypeLabel(item.quantity_type) : `${item.quantity}x`}
                        </td>
                        <td className="text-right py-2">₹{itemPrice.toFixed(2)}</td>
                        <td className="text-right py-2">
                          ₹{total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{billData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%):</span>
                <span>₹{billData.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹{billData.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              <p>Thank you for your visit!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

