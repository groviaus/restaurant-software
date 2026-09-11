'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryItem, Supplier } from '@/lib/types';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Plus,
  PackageCheck,
  Truck,
  Loader2,
  Building2,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PurchasesManagerProps {
  inventoryItems: InventoryItem[];
  outletId: string;
  onStockUpdated: () => void;
}

export function PurchasesManager({
  inventoryItems,
  outletId,
  onStockUpdated,
}: PurchasesManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO modal
  const [newPOOpen, setNewPOOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPOItems] = useState<
    Array<{ inventory_item_id: string; quantity: number; unit: string; unit_price: number }>
  >([]);
  const [creatingPO, setCreatingPO] = useState(false);

  // Receive modal
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<any | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [receiving, setReceiving] = useState(false);

  // Supplier modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const fetchPurchases = async () => {
    try {
      const [poRes, supRes] = await Promise.all([
        fetch('/api/inventory/purchases'),
        fetch('/api/inventory/suppliers'),
      ]);
      const [poData, supData] = await Promise.all([poRes.json(), supRes.json()]);
      setOrders(poData.orders ?? []);
      setSuppliers(supData.suppliers ?? []);
    } catch (err) {
      console.error('Failed to fetch purchases data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleAddPOItem = () => {
    const firstItem = inventoryItems[0];
    if (!firstItem) return;
    setPOItems([
      ...poItems,
      {
        inventory_item_id: firstItem.id,
        quantity: 1,
        unit: firstItem.stock_unit,
        unit_price: Number(firstItem.cost_per_unit || 0),
      },
    ]);
  };

  const handleCreatePO = async () => {
    if (poItems.length === 0) {
      toast.error('Add at least one item to the order');
      return;
    }
    setCreatingPO(true);
    try {
      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplierId || null,
          items: poItems.map((p) => ({
            inventory_item_id: p.inventory_item_id,
            quantity_ordered: Number(p.quantity),
            unit: p.unit,
            unit_price: Number(p.unit_price),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PO');
      toast.success('Purchase Order created');
      setNewPOOpen(false);
      setPOItems([]);
      fetchPurchases();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingPO(false);
    }
  };

  const openReceiveModal = async (poId: string) => {
    try {
      const res = await fetch(`/api/inventory/purchases?id=${poId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load PO details');
      setActivePO(data.order);
      const initialQtys: Record<string, number> = {};
      for (const item of data.order.items || []) {
        const remaining = Math.max(
          0,
          Number(item.quantity_ordered) - Number(item.quantity_received || 0)
        );
        initialQtys[item.id] = remaining;
      }
      setReceiveQtys(initialQtys);
      setReceiveModalOpen(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReceiveGoods = async () => {
    if (!activePO) return;
    setReceiving(true);
    try {
      const itemsToReceive = (activePO.items || []).map((item: any) => ({
        purchase_order_item_id: item.id,
        inventory_item_id: item.inventory_item_id,
        quantity_received: Number(receiveQtys[item.id] || 0),
        unit: item.unit,
        unit_price: Number(item.unit_price || 0),
      }));

      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'receive',
          id: activePO.id,
          items: itemsToReceive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to receive goods');

      toast.success('Goods received! Inventory stock updated.');
      setReceiveModalOpen(false);
      setActivePO(null);
      fetchPurchases();
      onStockUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReceiving(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    setCreatingSupplier(true);
    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supplierName.trim(),
          contact_name: supplierContact.trim() || undefined,
          contact_phone: supplierPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create supplier');
      toast.success('Supplier added');
      setSupplierModalOpen(false);
      setSupplierName('');
      setSupplierContact('');
      setSupplierPhone('');
      fetchPurchases();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingSupplier(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Received
          </span>
        );
      case 'partially_received':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock className="w-3 h-3" />
            Partial Received
          </span>
        );
      case 'ordered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Truck className="w-3 h-3" />
            Ordered
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-border/60 bg-muted/60 text-muted-foreground">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Control Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-2.5 sm:p-3 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Purchase Orders & Receiving</span>
            <span className="text-[10px] font-mono font-medium text-muted-foreground px-1.5 py-0.2 rounded bg-muted">
              {orders.length} orders
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Stock increments only when items are checked-in through Goods Received.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSupplierModalOpen(true)}
            className="h-8.5 px-3 text-xs font-semibold rounded-xl border-border/60 bg-card/80 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Suppliers ({suppliers.length})</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              handleAddPOItem();
              setNewPOOpen(true);
            }}
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase Order</span>
          </Button>
        </div>
      </div>

      {/* 2. Purchase Orders Table */}
      <div className="rounded-2xl border border-border/70 overflow-hidden bg-card shadow-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">PO Number</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading purchase orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 border border-border/60 shadow-2xs">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">No purchase orders found</p>
                      <p className="text-xs text-muted-foreground">
                        Create purchase orders to order fresh inventory from your vendors.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((po) => {
                const totalAmt = (po.items || []).reduce(
                  (sum: number, it: any) => sum + (it.quantity_ordered * it.unit_price || 0),
                  0
                );
                return (
                  <tr key={po.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      #{po.po_number || po.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {po.supplier?.name || po.supplier_name || 'General Supplier'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {po.items?.length || 0} items
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      ₹{totalAmt.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(po.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {po.status !== 'received' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReceiveModal(po.id)}
                          className="h-7 px-2.5 text-xs font-semibold rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 cursor-pointer gap-1 shadow-2xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive Goods</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Order Modal */}
      <Dialog open={newPOOpen} onOpenChange={setNewPOOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-2xl border border-border/70">
          <div className="bg-muted/40 border-b border-border/60 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Create Purchase Order
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Draft order quantities and costs. Stock increments only when goods are received.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Select Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="h-8.5 text-xs rounded-xl border-border/60 bg-background/80 shadow-none">
                  <SelectValue placeholder="Choose a registered supplier..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56">
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} {s.contact_phone ? `(${s.contact_phone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Order Items</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddPOItem}
                  className="h-7 text-xs text-primary font-semibold gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {poItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-muted/40 p-2.5 rounded-xl border border-border/60"
                  >
                    <div className="col-span-5">
                      <Select
                        value={item.inventory_item_id}
                        onValueChange={(val) => {
                          const inv = inventoryItems.find((i) => i.id === val);
                          const updated = [...poItems];
                          updated[idx].inventory_item_id = val;
                          if (inv) {
                            updated[idx].unit = inv.stock_unit;
                            updated[idx].unit_price = Number(inv.cost_per_unit || 0);
                          }
                          setPOItems(updated);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-border/60 bg-background/80 shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 rounded-xl">
                          {inventoryItems.map((i) => (
                            <SelectItem key={i.id} value={i.id} className="text-xs">
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="any"
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = parseFloat(e.target.value) || 0;
                          setPOItems(updated);
                        }}
                        placeholder="Qty"
                        className="h-8 text-xs rounded-lg border-border/60 bg-background/80 shadow-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        value={item.unit}
                        disabled
                        className="h-8 text-xs rounded-lg bg-muted text-muted-foreground border-border/40"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].unit_price = parseFloat(e.target.value) || 0;
                          setPOItems(updated);
                        }}
                        placeholder="Price"
                        className="h-8 text-xs rounded-lg border-border/60 bg-background/80 shadow-none"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPOItems(poItems.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {poItems.length > 0 && (
                <div className="flex justify-end pt-2 text-sm font-semibold text-foreground">
                  Total:{' '}
                  <span className="ml-2 text-primary font-mono font-bold">
                    ₹
                    {poItems
                      .reduce((acc, it) => acc + (it.quantity * it.unit_price || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 px-6 py-3 bg-muted/40 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewPOOpen(false)}
              disabled={creatingPO}
              className="h-8.5 rounded-xl border-border/60 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePO}
              disabled={creatingPO || poItems.length === 0}
              className="h-8.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold cursor-pointer"
            >
              {creatingPO && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Create Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Goods Modal */}
      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border border-border/70">
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Receive Goods — PO #{activePO?.po_number || activePO?.id?.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Enter delivered quantities. Inventory will increment and purchase ledger movements will be logged.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              {(activePO?.items || []).map((item: any) => {
                const ordered = Number(item.quantity_ordered);
                const prevReceived = Number(item.quantity_received || 0);
                const remaining = Math.max(0, ordered - prevReceived);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {item.inventory_item?.name || 'Item'}
                      </span>
                      <span className="text-muted-foreground text-[11px] font-mono">
                        Ordered: <strong>{ordered} {item.unit}</strong> · Received:{' '}
                        <strong>{prevReceived}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-[11px] text-muted-foreground">Receiving Quantity</Label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          max={remaining}
                          value={receiveQtys[item.id] ?? remaining}
                          onChange={(e) =>
                            setReceiveQtys({
                              ...receiveQtys,
                              [item.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-xs mt-1 rounded-lg border-border/60 bg-background/80 shadow-none"
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-[11px] text-muted-foreground">Unit</Label>
                        <Input
                          value={item.unit}
                          disabled
                          className="h-8 text-xs mt-1 rounded-lg bg-muted text-muted-foreground border-border/40"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border/60 px-6 py-3 bg-muted/40 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReceiveModalOpen(false)}
              disabled={receiving}
              className="h-8.5 rounded-xl border-border/60 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReceiveGoods}
              disabled={receiving}
              className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              {receiving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirm Delivery
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier Modal */}
      <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border border-border/70">
          <div className="bg-muted/40 border-b border-border/60 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Add Vendor / Supplier
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Register a supplier for purchases and goods replenishment
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleCreateSupplier} className="p-6 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Vendor Name</Label>
              <Input
                placeholder="e.g. Fresh Meat & Produce Co."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
                className="h-8.5 text-xs rounded-xl border-border/60 bg-background/80 shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Contact Person</Label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                className="h-8.5 text-xs rounded-xl border-border/60 bg-background/80 shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Phone Number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="h-8.5 text-xs rounded-xl border-border/60 bg-background/80 shadow-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSupplierModalOpen(false)}
                disabled={creatingSupplier}
                className="h-8.5 rounded-xl border-border/60 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creatingSupplier || !supplierName.trim()}
                className="h-8.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold cursor-pointer"
              >
                {creatingSupplier && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
