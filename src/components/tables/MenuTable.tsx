'use client';

import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MenuItem, PricingMode, QuantityType, Category } from '@/lib/types';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import {
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  Tag,
  IndianRupee,
  TrendingUp,
  Search,
  X,
  LayoutGrid,
  List,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  FolderTree,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDeleteMenuItemMutation,
  useUpdateMenuItemMutation,
} from '@/hooks/mutations/useMenuMutations';
import { cn } from '@/lib/utils';

interface MenuTableProps {
  items: MenuItem[];
  categories?: Category[];
  outletId: string;
  isSyncing?: boolean;
  onSync?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function MenuTable({
  items,
  categories = [],
  outletId,
  isSyncing = false,
  onSync,
  onRefresh,
  loading = false,
}: MenuTableProps) {
  const deleteMenuItemMutation = useDeleteMenuItemMutation();
  const updateMenuItemMutation = useUpdateMenuItemMutation();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');

  // View Mode: persisted in localStorage, defaults to grid
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resto_menu_view_mode');
        if (saved === 'grid' || saved === 'table') return saved;
      } catch {
        // ignore
      }
    }
    return 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('resto_menu_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Form and Selection States
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // Executive KPI Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const availableCount = items.filter((i) => i.available).length;
    const unavailableCount = total - availableCount;
    const availablePct = total > 0 ? Math.round((availableCount / total) * 100) : 0;

    // Distinct category names
    const catSet = new Set<string>();
    items.forEach((i) => {
      if (i.category) catSet.add(i.category);
    });
    const categoryCount = catSet.size;

    // Average price & highest price
    const sumPrice = items.reduce((acc, i) => acc + (i.price || 0), 0);
    const avgPrice = total > 0 ? (sumPrice / total).toFixed(0) : '0';
    const maxPrice = items.reduce((max, i) => Math.max(max, i.price || 0), 0);

    return {
      total,
      availableCount,
      unavailableCount,
      availablePct,
      categoryCount,
      avgPrice,
      maxPrice,
    };
  }, [items]);

  // List of distinct categories with counts for filter
  const categoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    // Pre-populate from categories prop if available
    categories.forEach((c) => {
      if (c.name) map.set(c.name, 0);
    });
    // Count items per category
    items.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [items, categories]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL') {
        const itemCat = item.category || 'Uncategorized';
        if (itemCat !== selectedCategory) return false;
      }

      // 3. Availability Filter
      if (availabilityFilter === 'AVAILABLE' && !item.available) return false;
      if (availabilityFilter === 'UNAVAILABLE' && item.available) return false;

      return true;
    });
  }, [items, searchQuery, selectedCategory, availabilityFilter]);

  // Quick Availability Toggle
  const handleQuickToggleAvailability = async (item: MenuItem) => {
    setTogglingItemId(item.id);
    try {
      await updateMenuItemMutation.mutateAsync({
        id: item.id,
        available: !item.available,
      });
      toast.success(
        `"${item.name}" marked as ${!item.available ? 'Available' : 'Unavailable'}`
      );
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update availability';
      toast.error(msg);
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMenuItemMutation.mutateAsync({ id: itemToDelete, outletId });
      onRefresh?.();
    } catch {
      // Toast handled in mutation
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to delete');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setDeleting(true);
    setBulkDeleteDialogOpen(false);
    let deletedCount = 0;
    let softDeletedCount = 0;
    let failedCount = 0;
    try {
      for (const itemId of selectedItems) {
        try {
          await deleteMenuItemMutation.mutateAsync({ id: itemId, outletId, silent: true });
          deletedCount++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('unavailable')) softDeletedCount++;
          else failedCount++;
        }
      }
      const messages = [];
      if (deletedCount > 0) messages.push(`${deletedCount} deleted`);
      if (softDeletedCount > 0) messages.push(`${softDeletedCount} marked unavailable (had orders)`);
      if (failedCount > 0) messages.push(`${failedCount} failed`);
      if (deletedCount > 0 || softDeletedCount > 0) toast.success(messages.join(', '));
      else toast.error('Failed to delete items');
      setSelectedItems(new Set());
      onRefresh?.();
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItems.has(item.id));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Menu Management
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {items.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage restaurant menu items, pricing structures, portions, and live POS stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Catalog Live</span>
          </div>

          {/* Sync Trigger */}
          {onSync && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSync}
              disabled={isSyncing}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 border-border/70"
              title="Refresh menu items"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-primary')} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
          )}

          {/* Add Menu Item Action */}
          <Button
            size="sm"
            onClick={handleAdd}
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Menu Item</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Dishes */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Dishes
            </span>
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UtensilsCrossed className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {loading && items.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded my-0.5" />
            ) : (
              metrics.total
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Catalog items active
          </p>
        </div>

        {/* Available in Stock */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available in Stock
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {loading && items.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded my-0.5" />
            ) : (
              metrics.availableCount
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            {metrics.availablePct}% ready to order ({metrics.unavailableCount} out of stock)
          </p>
        </div>

        {/* Categories Covered */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categories
            </span>
            <div className="h-7 w-7 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <FolderTree className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            {loading && items.length === 0 ? (
              <Skeleton className="h-7 w-12 rounded my-0.5" />
            ) : (
              metrics.categoryCount
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Across menu catalog groups
          </p>
        </div>

        {/* Average Dish Price */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Price
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {loading && items.length === 0 ? (
              <Skeleton className="h-7 w-16 rounded my-0.5" />
            ) : (
              `₹${metrics.avgPrice}`
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Max item price ₹{metrics.maxPrice.toFixed(0)}
          </p>
        </div>
      </div>

      {/* 3. Control Ribbon: Search, Category Filter, Availability & View Toggle */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Bar & Category Dropdown */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, ingredients, categories..."
                className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/60 bg-background/80 focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Category Select Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8.5 w-[140px] sm:w-[160px] text-xs rounded-xl border-border/60 bg-background/80">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl">
                <SelectItem value="ALL" className="text-xs font-semibold">
                  All Categories ({items.length})
                </SelectItem>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name} className="text-xs">
                    {cat.name} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
            {/* Availability Filter Segment */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              {(
                [
                  { id: 'ALL', label: 'All', count: metrics.total },
                  { id: 'AVAILABLE', label: 'Available', count: metrics.availableCount },
                  { id: 'UNAVAILABLE', label: 'Out of Stock', count: metrics.unavailableCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAvailabilityFilter(tab.id)}
                  className={cn(
                    'h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                    availabilityFilter === tab.id
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-semibold opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* View Mode Switcher: Grid / Table */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                className={cn(
                  'h-7.5 w-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Grid / Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('table')}
                className={cn(
                  'h-7.5 w-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Ribbon & Select All */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between px-1 py-1 text-xs">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all items"
                className="!h-4 !w-4 rounded-md"
              />
              <span className="text-muted-foreground font-medium">
                {selectedItems.size > 0 ? (
                  <span className="text-foreground font-semibold">
                    {selectedItems.size} of {filteredItems.length} selected
                  </span>
                ) : (
                  <span>Select all</span>
                )}
              </span>

              {selectedItems.size > 0 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openBulkDeleteDialog}
                    disabled={deleting}
                    className="h-7 px-2.5 text-xs rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete ({selectedItems.size})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems(new Set())}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Showing <strong className="font-semibold text-foreground">{filteredItems.length}</strong>{' '}
                {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
              {(searchQuery || selectedCategory !== 'ALL' || availabilityFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setAvailabilityFilter('ALL');
                  }}
                  className="text-primary hover:underline font-medium cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Mobile-First Card Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {loading && items.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-28 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-20 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
                <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
              </div>
            ))
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center space-y-3 bg-card/40">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No dishes found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'ALL' || availabilityFilter !== 'ALL'
                    ? 'No menu items match your search or filter criteria.'
                    : 'Create your first menu item to start taking orders on the POS.'}
                </p>
              </div>
              {!searchQuery && selectedCategory === 'ALL' && availabilityFilter === 'ALL' && (
                <Button size="sm" onClick={handleAdd} className="rounded-xl mt-2">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add First Dish
                </Button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const isToggling = togglingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'group bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between',
                    isSelected && 'ring-2 ring-primary border-primary bg-primary/[0.02]',
                    !item.available && 'opacity-85 border-border/50'
                  )}
                >
                  {/* Card Header: Checkbox, Name, Category & Quick Availability Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          aria-label={`Select ${item.name}`}
                          className="!h-4 !w-4 rounded-md mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-1">
                            {item.name}
                          </h3>
                          {item.category && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <Tag className="h-3 w-3 text-primary/70 flex-shrink-0" />
                              <span className="truncate font-medium">{item.category}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Availability Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleQuickToggleAvailability(item)}
                        disabled={isToggling}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer flex-shrink-0 border',
                          item.available
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
                          isToggling && 'opacity-50 pointer-events-none'
                        )}
                        title="Click to toggle dish availability"
                      >
                        {item.available ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {item.description ? (
                        item.description
                      ) : (
                        <span className="italic opacity-50">No description provided</span>
                      )}
                    </p>
                  </div>

                  {/* Price, Portion Structure & Profit Margin */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-muted-foreground">₹</span>
                        <span className="font-mono text-lg sm:text-xl font-bold text-foreground">
                          {item.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Profit Margin Pill */}
                      {item.profit_margin_percent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <TrendingUp className="h-3 w-3" />
                          <span>{item.profit_margin_percent}% margin</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Portion Pricing Mode Info */}
                    {item.pricing_mode !== PricingMode.FIXED && (
                      <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/50 space-y-1">
                        <div className="font-semibold text-foreground/80 flex items-center justify-between">
                          <span>
                            {item.pricing_mode === PricingMode.QUANTITY_AUTO
                              ? 'Auto-Calculated Portions'
                              : 'Manual Portion Pricing'}
                          </span>
                        </div>

                        {/* Quantity Type Chips */}
                        {item.requires_quantity && item.available_quantity_types && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.available_quantity_types.map((qType) => {
                              const label =
                                qType === QuantityType.QUARTER
                                  ? 'Q'
                                  : qType === QuantityType.HALF
                                    ? 'H'
                                    : qType === QuantityType.THREE_QUARTER
                                      ? '3Q'
                                      : 'F';
                              const manualPrice =
                                qType === QuantityType.QUARTER
                                  ? item.quarter_price
                                  : qType === QuantityType.HALF
                                    ? item.half_price
                                    : qType === QuantityType.THREE_QUARTER
                                      ? item.three_quarter_price
                                      : item.full_price;

                              return (
                                <span
                                  key={qType}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-background border border-border/70 text-foreground"
                                >
                                  <span>{label}</span>
                                  {manualPrice !== undefined && manualPrice !== null && (
                                    <span className="text-muted-foreground font-mono">
                                      ₹{manualPrice}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                      className="h-8 px-3 text-xs font-semibold rounded-xl border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(item.id)}
                      className="h-8 px-2 text-xs font-semibold rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1"
                      title="Delete dish"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Dense Desktop Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all items"
                      className="!h-4 !w-4 rounded-md"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-xs min-w-[180px]">Dish & Category</TableHead>
                  <TableHead className="font-semibold text-xs min-w-[130px]">Pricing Mode</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Price</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Margin</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right w-[110px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && items.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/50">
                      <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32 rounded mb-1" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-12 rounded mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 rounded-xl ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-foreground text-sm">No dishes found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try changing your search query or filters.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const isToggling = togglingItemId === item.id;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'border-b border-border/50 hover:bg-muted/30 transition-colors',
                          isSelected && 'bg-primary/[0.03]'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            aria-label={`Select ${item.name}`}
                            className="!h-4 !w-4 rounded-md"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs sm:text-sm text-foreground block">
                              {item.name}
                            </span>
                            {item.category && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Tag className="h-2.5 w-2.5 text-primary" />
                                <span>{item.category}</span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-foreground">
                              {item.pricing_mode === PricingMode.FIXED && 'Fixed Price'}
                              {item.pricing_mode === PricingMode.QUANTITY_AUTO && 'Auto Portions'}
                              {item.pricing_mode === PricingMode.QUANTITY_MANUAL && 'Manual Portions'}
                            </span>
                            {item.pricing_mode !== PricingMode.FIXED &&
                              item.available_quantity_types && (
                                <div className="flex gap-1">
                                  {item.available_quantity_types.map((t) => (
                                    <span
                                      key={t}
                                      className="px-1 py-0.2 rounded text-[9px] font-semibold bg-muted text-muted-foreground border border-border/60"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs sm:text-sm text-foreground">
                          ₹{item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.profit_margin_percent ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            >
                              {item.profit_margin_percent}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => handleQuickToggleAvailability(item)}
                            disabled={isToggling}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border',
                              item.available
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
                              isToggling && 'opacity-50 pointer-events-none'
                            )}
                            title="Click to toggle availability"
                          >
                            {item.available ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>In Stock</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                <span>Out of Stock</span>
                              </>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              className="h-7.5 w-7.5 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                              title="Edit Dish"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteDialog(item.id)}
                              className="h-7.5 w-7.5 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete Dish"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      )}

      {/* 6. Modals & Confirmation Dialogs */}
      <MenuItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        menuItem={editingItem}
        outletId={outletId}
        onSuccess={() => {
          onRefresh?.();
        }}
      />

      {/* Single Item Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-[440px] rounded-2xl border-border/70 p-5 sm:p-6 shadow-xl">
          <AlertDialogHeader className="space-y-1.5">
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>Delete Menu Item</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <span>
                Are you sure you want to delete this menu item? This action cannot be undone.
              </span>
              {itemToDelete && items.find((i) => i.id === itemToDelete) && (
                <span className="block mt-1 font-semibold text-foreground text-sm">
                  &quot;{items.find((i) => i.id === itemToDelete)?.name}&quot;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel className="rounded-xl h-8 text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-[440px] rounded-2xl border-border/70 p-5 sm:p-6 shadow-xl">
          <AlertDialogHeader className="space-y-1.5">
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>Delete Multiple Dishes</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <span>
                Are you sure you want to delete{' '}
                <strong className="text-foreground font-semibold">
                  {selectedItems.size}
                </strong>{' '}
                menu items? This action cannot be undone.
              </span>
              <span className="block text-[11px] text-muted-foreground/80 mt-1">
                Items with existing completed orders will automatically be marked as unavailable
                to preserve financial records.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel className="rounded-xl h-8 text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="rounded-xl h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete {selectedItems.size} Dishes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
