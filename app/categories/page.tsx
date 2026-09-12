'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Store,
  Search,
  X,
  RefreshCw,
  FolderTree,
  UtensilsCrossed,
  ListOrdered,
  LayoutGrid,
  List,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Category, Outlet } from '@/lib/types';
import { useOutlet } from '@/hooks/useOutlet';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// In-memory cache across navigation transitions
const categoriesMemoryCache: Record<string, Category[]> = {};
let outletsMemoryCache: Outlet[] | null = null;

export default function CategoriesPage() {
  const router = useRouter();
  const { currentOutlet } = useOutlet();
  const { checkPermission, loading: permLoading } = usePermissions();
  const cachedCats = currentOutlet?.id ? categoriesMemoryCache[currentOutlet.id] : undefined;

  const [categories, setCategories] = useState<Category[]>(() => cachedCats || []);
  const [outlets, setOutlets] = useState<Outlet[]>(() => outletsMemoryCache || []);
  const [loading, setLoading] = useState(!cachedCats);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState<'ALL' | 'WITH_ITEMS' | 'EMPTY'>('ALL');

  // View Mode: persisted in localStorage, defaults to grid
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resto_categories_view_mode');
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
      localStorage.setItem('resto_categories_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Modal form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    if (!permLoading && !checkPermission('menu', 'view')) {
      router.push('/dashboard');
    }
  }, [permLoading, checkPermission, router]);

  const fetchCategories = useCallback(async (isManual = false) => {
    if (!currentOutlet) return;
    if (isManual) setIsSyncing(true);
    else if (!categoriesMemoryCache[currentOutlet.id]) setLoading(true);

    try {
      const response = await fetch(`/api/categories?outlet_id=${currentOutlet.id}`);
      if (response.ok) {
        const data = await response.json();
        const cats = data.categories || [];
        setCategories(cats);
        categoriesMemoryCache[currentOutlet.id] = cats;
        if (isManual) toast.success('Categories synced');
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsSyncing(false), 400);
    }
  }, [currentOutlet]);

  const fetchOutlets = useCallback(async () => {
    try {
      const response = await fetch('/api/outlets');
      if (response.ok) {
        const data = await response.json();
        const outs = data.outlets || data || [];
        setOutlets(outs);
        outletsMemoryCache = outs;
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  }, []);

  useEffect(() => {
    if (currentOutlet && !permLoading) {
      fetchCategories();
      fetchOutlets();
    }
  }, [currentOutlet, permLoading, fetchCategories, fetchOutlets]);

  // Executive KPI Metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    const totalItems = categories.reduce((sum, c) => sum + (c.items_count || 0), 0);
    const withItems = categories.filter((c) => (c.items_count || 0) > 0).length;
    const emptyCount = total - withItems;
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
    const coveragePercent = total > 0 ? Math.round((withItems / total) * 100) : 0;

    return {
      total,
      totalItems,
      withItems,
      emptyCount,
      maxOrder,
      coveragePercent,
    };
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesDesc = (cat.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Segment Filter
      const itemCount = cat.items_count || 0;
      if (filterSegment === 'WITH_ITEMS' && itemCount === 0) return false;
      if (filterSegment === 'EMPTY' && itemCount > 0) return false;

      return true;
    });
  }, [categories, searchQuery, filterSegment]);

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order,
      });
      setSelectedOutletIds([category.outlet_id]);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        display_order: categories.length,
      });
      setSelectedOutletIds(currentOutlet ? [currentOutlet.id] : []);
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', display_order: 0 });
    setSelectedOutletIds([]);
  };

  const handleSelectAllOutlets = () => {
    if (selectedOutletIds.length === outlets.length) {
      setSelectedOutletIds(currentOutlet ? [currentOutlet.id] : []);
    } else {
      setSelectedOutletIds(outlets.map((o) => o.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet) return;

    try {
      if (editingCategory) {
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('Category updated');
          handleCloseForm();
          fetchCategories();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to update category');
        }
      } else {
        const payload = {
          ...formData,
          outlet_ids: selectedOutletIds,
        };

        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const successCount = selectedOutletIds.length;
          toast.success(
            successCount > 1
              ? `Category created in ${successCount} outlets`
              : 'Category created'
          );
          handleCloseForm();
          fetchCategories();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to create category');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Category "${name}" deleted`);
        fetchCategories();
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  if (permLoading || (loading && categories.length === 0)) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <Skeleton className="h-8.5 w-32 rounded-xl" />
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>

        {/* Controls Skeleton */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8.5 w-64 rounded-xl" />
          <Skeleton className="h-8.5 w-36 rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentOutlet) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Please select an outlet from the top bar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Menu Categories
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {categories.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Organize menu items, customize digital menu sections, and set display order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Active Menu</span>
          </div>

          {/* Sync Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchCategories(true)}
            disabled={isSyncing}
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 border-border/70"
            title="Refresh categories"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          {/* Add Category Action */}
          <Button
            size="sm"
            onClick={() => handleOpenForm()}
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Categories */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Categories
            </span>
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FolderTree className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            {metrics.total}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Menu sections active
          </p>
        </div>

        {/* Total Menu Items */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Dishes
            </span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UtensilsCrossed className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.totalItems}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Assigned to categories
          </p>
        </div>

        {/* Populated Coverage */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu Coverage
            </span>
            <div className="h-7 w-7 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            {metrics.coveragePercent}%
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            {metrics.withItems} populated, {metrics.emptyCount} empty
          </p>
        </div>

        {/* Display Sequence Order */}
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-4 space-y-1 shadow-xs hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Display Sequence
            </span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ListOrdered className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="font-mono text-lg sm:text-2xl font-black text-foreground">
            0 to {metrics.maxOrder}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            Priority ordering sequence
          </p>
        </div>
      </div>

      {/* 3. Control Ribbon: Search, Filter Segment & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
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

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Quick Segment Filter: All / With Items / Empty */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
            {(
              [
                { id: 'ALL', label: 'All', count: metrics.total },
                { id: 'WITH_ITEMS', label: 'With Items', count: metrics.withItems },
                { id: 'EMPTY', label: 'Empty', count: metrics.emptyCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterSegment(tab.id)}
                className={cn(
                  'h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                  filterSegment === tab.id
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

      {/* 4. Results Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          Showing <strong className="font-semibold text-foreground">{filteredCategories.length}</strong>{' '}
          {filteredCategories.length === 1 ? 'category' : 'categories'}
        </span>
        {(searchQuery || filterSegment !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterSegment('ALL');
            }}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Reset search & filters
          </button>
        )}
      </div>

      {/* 5. Mobile-First Card Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-10 text-center space-y-3 bg-card/40">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No categories found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || filterSegment !== 'ALL'
                    ? 'No categories match your search or filter criteria.'
                    : 'Create your first category to start organizing your menu items.'}
                </p>
              </div>
              {!searchQuery && filterSegment === 'ALL' && (
                <Button
                  size="sm"
                  onClick={() => handleOpenForm()}
                  className="rounded-xl mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add First Category
                </Button>
              )}
            </div>
          ) : (
            filteredCategories.map((category) => {
              const itemCount = category.items_count || 0;

              return (
                <div
                  key={category.id}
                  className="group bg-card border border-border/70 rounded-2xl p-4 space-y-3.5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  {/* Card Header: Name & Display Order */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground truncate">
                            {category.name}
                          </h3>
                        </div>
                      </div>

                      {/* Display Order Pill */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60 shadow-2xs flex-shrink-0">
                        <ListOrdered className="h-3 w-3" />
                        Order {category.display_order}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[1.5rem]">
                      {category.description ? (
                        category.description
                      ) : (
                        <span className="italic opacity-60">No description provided</span>
                      )}
                    </p>
                  </div>

                  {/* Badges: Items Count */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                    {itemCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <UtensilsCrossed className="h-3 w-3" />
                        <span>{itemCount} {itemCount === 1 ? 'dish' : 'dishes'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                        <AlertCircle className="h-3 w-3 opacity-60" />
                        <span>0 dishes</span>
                      </span>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenForm(category)}
                      className="h-8 px-3 text-xs font-semibold rounded-xl border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(category.id, category.name)}
                      className="h-8 px-2 text-xs font-semibold rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1"
                      title="Delete Category"
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

      {/* 6. Dense Desktop Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[80px] font-semibold text-xs">Order</TableHead>
                  <TableHead className="w-[180px] font-semibold text-xs">Category Name</TableHead>
                  <TableHead className="font-semibold text-xs">Description</TableHead>
                  <TableHead className="w-[120px] font-semibold text-xs">Dishes</TableHead>
                  <TableHead className="text-right w-[120px] font-semibold text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-foreground text-sm">No categories found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Try changing your search query.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => {
                    const itemCount = category.items_count || 0;

                    return (
                      <TableRow
                        key={category.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                            #{category.display_order}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm text-foreground">
                          {category.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          {itemCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            >
                              {itemCount} {itemCount === 1 ? 'dish' : 'dishes'}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-muted text-muted-foreground border-border/60"
                            >
                              0 dishes
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenForm(category)}
                              className="h-7.5 w-7.5 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(category.id, category.name)}
                              className="h-7.5 w-7.5 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete Category"
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

      {/* 7. Category Form Dialog (Mobile-First & Laptop Optimized) */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl border-border/70 p-4 sm:p-6 shadow-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingCategory
                ? 'Update category name, description, and display sequence priority.'
                : 'Add a new category to organize your dishes on the POS & digital menu.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Multi-Outlet Selection */}
            {!editingCategory && outlets.length > 1 && (
              <div className="rounded-xl border border-dashed border-border/70 p-3 sm:p-3.5 space-y-2.5 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-primary" />
                    Apply to Outlets
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllOutlets}
                    className="h-6 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    {selectedOutletIds.length === outlets.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {outlets.map((outlet) => (
                    <label
                      key={outlet.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all',
                        selectedOutletIds.includes(outlet.id)
                          ? 'bg-primary/10 border-primary/40 text-foreground font-semibold shadow-2xs'
                          : 'bg-background/80 border-border/60 text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <Checkbox
                        checked={selectedOutletIds.includes(outlet.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOutletIds((prev) => [...prev, outlet.id]);
                          } else {
                            if (selectedOutletIds.length > 1) {
                              setSelectedOutletIds((prev) => prev.filter((id) => id !== outlet.id));
                            }
                          }
                        }}
                      />
                      <span className="truncate flex-1">{outlet.name}</span>
                      {currentOutlet && outlet.id === currentOutlet.id && (
                        <span className="text-[10px] text-primary font-bold px-1.5 py-0.2 rounded-md bg-primary/15">
                          Current
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Category Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                Category Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Starters, Beverages, Biryani"
                className="h-9 text-xs rounded-xl border-border/60 focus-visible:ring-primary/20"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary shown on customer digital menu..."
                rows={2}
                className="text-xs rounded-xl border-border/60 focus-visible:ring-primary/20"
              />
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <Label htmlFor="display_order" className="text-xs font-semibold text-foreground">
                Display Order Priority
              </Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
                min="0"
                className="h-9 text-xs rounded-xl border-border/60 focus-visible:ring-primary/20"
              />
              <p className="text-[11px] text-muted-foreground">
                Lower numbers (e.g. 0, 1) appear first in the POS category bar and QR menu.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/60">
              <Button
                type="submit"
                className="flex-1 order-1 sm:order-2 h-9 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
              >
                {editingCategory
                  ? 'Update Category'
                  : `Create Category${!editingCategory && selectedOutletIds.length > 1 ? ` (${selectedOutletIds.length})` : ''}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                className="flex-1 order-2 sm:order-1 h-9 text-xs font-semibold rounded-xl border-border/70 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
