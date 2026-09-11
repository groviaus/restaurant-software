'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryItem, InventoryItemType, StockStatus } from '@/lib/types';
import { formatStockDisplay } from '@/lib/inventory/unitConversions';
import { InventoryItemForm } from '@/components/forms/InventoryItemForm';
import { RecordMovementForm } from '@/components/forms/RecordMovementForm';
import {
  Boxes,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Search,
  X,
  Plus,
  ArrowUpCircle,
  Pencil,
  CheckCircle2,
  XCircle,
  Package2,
  FolderTree,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEM_TYPE_LABELS: Record<InventoryItemType, string> = {
  raw_material: 'Raw Material',
  ingredient: 'Ingredient',
  prepared_item: 'Prepared',
  packaging: 'Packaging',
  other: 'Other',
};

const ITEM_TYPE_STYLES: Record<InventoryItemType, string> = {
  raw_material: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  ingredient: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  prepared_item: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  packaging: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  other: 'bg-muted text-muted-foreground border-border/60',
};

function getStockStatus(item: InventoryItem): StockStatus {
  if (item.current_stock <= 0) return StockStatus.OUT_OF_STOCK;
  if (item.min_stock > 0 && item.current_stock <= item.min_stock) return StockStatus.CRITICAL;
  if (item.reorder_level > 0 && item.current_stock <= item.reorder_level) return StockStatus.LOW_STOCK;
  return StockStatus.HEALTHY;
}

function StockStatusBadge({ item }: { item: InventoryItem }) {
  const status = getStockStatus(item);

  const configs: Record<StockStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    [StockStatus.HEALTHY]: {
      label: 'Healthy',
      cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    [StockStatus.LOW_STOCK]: {
      label: 'Low Stock',
      cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    [StockStatus.CRITICAL]: {
      label: 'Critical',
      cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    [StockStatus.OUT_OF_STOCK]: {
      label: 'Out of Stock',
      cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const cfg = configs[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs',
        cfg.cls
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

interface InventoryItemsTableProps {
  items: InventoryItem[];
  outletId: string;
  onRefetch: () => void;
}

export function InventoryItemsTable({ items, outletId, onRefetch }: InventoryItemsTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [preSelectedItemId, setPreSelectedItemId] = useState<string | undefined>();

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = items.length;
    const totalVal = items.reduce(
      (sum, item) => sum + Math.max(0, Number(item.current_stock || 0)) * Number(item.cost_per_unit || 0),
      0
    );
    const lowCount = items.filter((i) => {
      const s = getStockStatus(i);
      return s === StockStatus.LOW_STOCK || s === StockStatus.CRITICAL;
    }).length;
    const outCount = items.filter((i) => getStockStatus(i) === StockStatus.OUT_OF_STOCK).length;
    const healthyCount = items.filter((i) => getStockStatus(i) === StockStatus.HEALTHY).length;

    return { total, totalVal, lowCount, outCount, healthyCount };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.category ?? '').toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || item.item_type === typeFilter;

      const status = getStockStatus(item);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'low' && (status === StockStatus.LOW_STOCK || status === StockStatus.CRITICAL)) ||
        (statusFilter === 'out' && status === StockStatus.OUT_OF_STOCK) ||
        (statusFilter === 'healthy' && status === StockStatus.HEALTHY);

      return matchSearch && matchType && matchStatus;
    });
  }, [items, search, typeFilter, statusFilter]);

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleAddMovement = (item: InventoryItem) => {
    setPreSelectedItemId(item.id);
    setMovementFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Executive KPI Metrics Strip */}
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
            {metrics.total}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            {items.filter((i) => i.active).length} active raw materials
          </p>
        </div>

        {/* Inventory Value */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Inventory Value
            </span>
            <div className="h-7 w-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            ₹{metrics.totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            At active cost valuation
          </p>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={cn(
            'bg-card border rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs transition-all cursor-pointer',
            statusFilter === 'low'
              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
              : 'border-border/70 hover:border-amber-500/30'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Low Stock
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics.lowCount}
          </div>
          <p className="text-[11px] text-amber-600/80 font-medium truncate">
            Below min / reorder level
          </p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}
          className={cn(
            'bg-card border rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs transition-all cursor-pointer',
            statusFilter === 'out'
              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
              : 'border-border/70 hover:border-rose-500/30'
          )}
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
            {metrics.outCount}
          </div>
          <p className="text-[11px] text-rose-600/80 font-medium truncate">
            Ingredients depleted
          </p>
        </div>
      </div>

      {/* 2. Unified Control Ribbon: Search, Type Filter, Status Segment & Movement Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-card/60 p-2.5 sm:p-3 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
        {/* Search Bar & Type Select */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items, SKU, categories..."
              className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/60 bg-background/80 focus-visible:ring-primary/20 shadow-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8.5 w-[130px] sm:w-[150px] text-xs rounded-xl border-border/60 bg-background/80 shadow-none">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl">
              <SelectItem value="all" className="text-xs font-semibold">All Types</SelectItem>
              {Object.entries(ITEM_TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Segmented Pill Filter & Direct Movement Action */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
            {[
              { id: 'all', label: 'All', count: metrics.total },
              { id: 'healthy', label: 'Healthy', count: metrics.healthyCount },
              { id: 'low', label: 'Low Stock', count: metrics.lowCount },
              { id: 'out', label: 'Out of Stock', count: metrics.outCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                  statusFilter === tab.id
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-semibold opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPreSelectedItemId(undefined);
              setMovementFormOpen(true);
            }}
            className="h-8.5 px-3 text-xs font-semibold rounded-xl border-border/60 bg-card/80 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <ArrowUpCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Record Movement</span>
          </Button>
        </div>
      </div>

      {/* 3. Items Master Table with Rich Aesthetics */}
      <div className="rounded-2xl border border-border/70 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              <TableHead className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Item Details</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Classification</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Current Stock</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Thresholds</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Unit Cost</TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 border border-border/60 shadow-2xs">
                      <Package2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">No inventory items found</p>
                      <p className="text-xs text-muted-foreground">
                        {items.length === 0
                          ? 'Get started by creating your raw materials, ingredients, or packaging items.'
                          : 'No items match your active search or filters. Try resetting the criteria.'}
                      </p>
                    </div>
                    {items.length === 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setFormOpen(true);
                        }}
                        className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create First Item
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const status = getStockStatus(item);
                const isLow = status === StockStatus.LOW_STOCK || status === StockStatus.CRITICAL;
                const isOut = status === StockStatus.OUT_OF_STOCK;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'transition-colors border-b border-border/40 last:border-0 hover:bg-muted/40',
                      isOut && 'bg-rose-500/[0.03]',
                      isLow && 'bg-amber-500/[0.03]'
                    )}
                  >
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          {item.sku ? <span>SKU: {item.sku}</span> : null}
                          {item.storage_location ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              📍 {item.storage_location}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-md border shadow-2xs',
                            ITEM_TYPE_STYLES[item.item_type]
                          )}
                        >
                          {ITEM_TYPE_LABELS[item.item_type]}
                        </span>
                        {item.category && (
                          <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={cn(
                            'font-mono font-bold text-sm',
                            isOut
                              ? 'text-muted-foreground'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-foreground'
                          )}
                        >
                          {formatStockDisplay(Number(item.current_stock), item.stock_unit)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <div className="space-y-0.5">
                        <div>Min: <span className="font-mono font-medium text-foreground">{item.min_stock} {item.stock_unit}</span></div>
                        {item.reorder_level > 0 && (
                          <div className="text-[11px] opacity-70">Reorder: {item.reorder_level} {item.stock_unit}</div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <StockStatusBadge item={item} />
                    </TableCell>

                    <TableCell className="py-3 text-xs text-foreground font-medium">
                      {item.cost_per_unit > 0 ? (
                        <span className="font-mono">₹{Number(item.cost_per_unit).toFixed(2)} / {item.stock_unit}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddMovement(item)}
                          className="h-7 px-2.5 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/10 cursor-pointer gap-1 shadow-2xs"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          <span>Stock</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit item properties"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <InventoryItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        outletId={outletId}
        onSuccess={() => onRefetch()}
      />
      <RecordMovementForm
        open={movementFormOpen}
        onOpenChange={setMovementFormOpen}
        inventoryItems={items}
        preSelectedItemId={preSelectedItemId}
        outletId={outletId}
        onSuccess={() => onRefetch()}
      />
    </div>
  );
}
