'use client';

import { useMemo } from 'react';
import { InventoryItem, InventoryMovement, InventoryTransactionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Boxes,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  ArrowDownRight,
  Trash2,
  ShoppingCart,
  ClipboardCheck,
  Plus,
  ChevronRight,
  Activity,
  Sparkles,
  ArrowUpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryDashboardViewProps {
  items: InventoryItem[];
  movements: InventoryMovement[];
  loading?: boolean;
  onOpenRecordMovement: () => void;
  onOpenWastage: () => void;
  onOpenStockCount: () => void;
  onOpenNewItem: () => void;
  onNavigateTab: (tab: string) => void;
}

export function InventoryDashboardView({
  items,
  movements,
  loading = false,
  onOpenRecordMovement,
  onOpenWastage,
  onOpenStockCount,
  onOpenNewItem,
  onNavigateTab,
}: InventoryDashboardViewProps) {
  const totalItems = items.length;

  const totalValue = useMemo(() => {
    return items.reduce((acc, it) => {
      const stock = Math.max(0, Number(it.current_stock || 0));
      const cost = Number(it.cost_per_unit || 0);
      return acc + stock * cost;
    }, 0);
  }, [items]);

  const lowStockItems = useMemo(
    () => items.filter((i) => i.current_stock <= i.min_stock && i.current_stock > 0),
    [items]
  );

  const outOfStockItems = useMemo(
    () => items.filter((i) => i.current_stock <= 0),
    [items]
  );

  // Today's consumption & wastage calculations
  const { todayConsumptionCount, todayWastageCount, topConsumed, topWasted } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let consumedCount = 0;
    let wastageCount = 0;
    const consumedMap: Record<string, { name: string; qty: number; unit: string }> = {};
    const wastedMap: Record<string, { name: string; qty: number; unit: string }> = {};

    for (const m of movements) {
      const mDate = new Date(m.created_at);
      const isToday = mDate >= today;
      const itemName = (m.inventory_item as any)?.name || 'Unknown Item';
      const absQty = Math.abs(Number(m.quantity_change));

      if (m.transaction_type === InventoryTransactionType.SALE_CONSUMPTION) {
        if (isToday) consumedCount += absQty;
        if (!consumedMap[m.inventory_item_id]) {
          consumedMap[m.inventory_item_id] = { name: itemName, qty: 0, unit: m.unit };
        }
        consumedMap[m.inventory_item_id].qty += absQty;
      }

      if (
        m.transaction_type === InventoryTransactionType.WASTAGE ||
        m.transaction_type === InventoryTransactionType.SPOILAGE ||
        m.transaction_type === InventoryTransactionType.DAMAGE
      ) {
        if (isToday) wastageCount += absQty;
        if (!wastedMap[m.inventory_item_id]) {
          wastedMap[m.inventory_item_id] = { name: itemName, qty: 0, unit: m.unit };
        }
        wastedMap[m.inventory_item_id].qty += absQty;
      }
    }

    const topConsumedArr = Object.values(consumedMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const topWastedArr = Object.values(wastedMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      todayConsumptionCount: consumedCount,
      todayWastageCount: wastageCount,
      topConsumed: topConsumedArr,
      topWasted: topWastedArr,
    };
  }, [movements]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Quick Operations Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-3 sm:p-4 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Fast Stock Actions</span>
            <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              Live POS Integration
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Execute physical count audits, loss declarations, or ledger adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenRecordMovement}
            className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/60 bg-card/80 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Movement</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenWastage}
            className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/60 bg-card/80 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Wastage</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenStockCount}
            className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/60 bg-card/80 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock Count</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenNewItem}
            className="h-8 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Items */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Items
            </span>
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {loading ? <Skeleton className="h-7 w-12 my-0.5" /> : totalItems}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Ingredients & packaging tracked
          </p>
        </div>

        {/* Stock Valuation */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Stock Valuation
            </span>
            <div className="h-7 w-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {loading ? <Skeleton className="h-7 w-20 my-0.5" /> : `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Total on-hand asset value
          </p>
        </div>

        {/* Low Stock Attention */}
        <div
          onClick={() => onNavigateTab('items')}
          className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {loading ? <Skeleton className="h-7 w-10 my-0.5" /> : lowStockItems.length}
          </div>
          <p className="text-[11px] text-amber-600/80 font-medium truncate">
            Under minimum threshold
          </p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => onNavigateTab('items')}
          className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="h-7 w-7 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {loading ? <Skeleton className="h-7 w-10 my-0.5" /> : outOfStockItems.length}
          </div>
          <p className="text-[11px] text-rose-600/80 font-medium truncate">
            Disables linked dishes in POS
          </p>
        </div>
      </div>

      {/* 3. Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Stock Replenishment & Movements */}
        <div className="lg:col-span-7 space-y-4">
          {/* Replenishment Section */}
          <div className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">Stock Replenishment Queue</h3>
              </div>
              <button
                onClick={() => onNavigateTab('items')}
                className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                Manage Items <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  All inventory stocks are healthy. No items require immediate purchase.
                </div>
              ) : (
                <>
                  {outOfStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-rose-500/30 bg-rose-500/10">
                            Depleted
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          0 {item.stock_unit} · Min required: {item.min_stock} {item.stock_unit}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-rose-600">Urgent Restock</span>
                    </div>
                  ))}

                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold">
                            Low
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Current: {item.current_stock} {item.stock_unit} (Min: {item.min_stock})
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-amber-600">
                        Order +{Math.max(1, (item.reorder_level || item.min_stock * 2) - item.current_stock)} {item.stock_unit}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">Recent Ledger Entries</h3>
              </div>
              <button
                onClick={() => onNavigateTab('movements')}
                className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                View Ledger <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-border/40 text-xs">
              {movements.slice(0, 5).map((mov) => {
                const isNegative = Number(mov.quantity_change) < 0;
                return (
                  <div key={mov.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        {(mov.inventory_item as any)?.name || 'Stock Item'}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{mov.transaction_type.replace(/_/g, ' ')}</span>
                        {mov.reference_label && <span className="font-mono text-primary font-semibold">· {mov.reference_label}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'font-mono font-bold text-xs',
                          isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {isNegative ? '' : '+'}
                        {mov.quantity_change} {mov.unit}
                      </span>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {mov.quantity_before} → {mov.quantity_after} {mov.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Top Consumed & Top Wasted Analytics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Consumed */}
          <div className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <ArrowDownRight className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">Top Consumed Ingredients</h3>
            </div>

            <div className="space-y-2.5">
              {topConsumed.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No sales consumption recorded yet. Bill settlement automatically tallies ingredient usage.
                </p>
              ) : (
                topConsumed.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      {item.qty.toFixed(1)} {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Wasted */}
          <div className="bg-card rounded-2xl border border-border/70 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">Loss & Wastage Summary</h3>
            </div>

            <div className="space-y-2.5">
              {topWasted.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No wastage or damage logged. Use &ldquo;Wastage&rdquo; to track spoilage and loss.
                </p>
              ) : (
                topWasted.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-mono font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                      -{item.qty.toFixed(1)} {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
