'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryItemsTable } from '@/components/inventory/InventoryItemsTable';
import { InventoryMovementsLog } from '@/components/inventory/InventoryMovementsLog';
import { RecipeBuilder } from '@/components/inventory/RecipeBuilder';
import { RecordMovementForm } from '@/components/forms/RecordMovementForm';
import { InventoryItemForm } from '@/components/forms/InventoryItemForm';
import { RecordWastageModal } from '@/components/inventory/RecordWastageModal';
import { StockCountWorkflow } from '@/components/inventory/StockCountWorkflow';
import { PurchasesManager } from '@/components/inventory/PurchasesManager';
import { InventoryDashboardView } from '@/components/inventory/InventoryDashboardView';
import { InventoryItem, InventoryMovement, MenuItem, Recipe } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package2, ClipboardList, ChefHat, AlertTriangle, RotateCcw,
  TrendingDown, Boxes, LayoutDashboard, ShoppingCart,
  Plus, ClipboardCheck, Trash2, Search, X, CupSoda
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { useOutlet } from '@/hooks/useOutlet';

interface InventoryPageClientProps {
  outletId?: string;
}

// Client-side in-memory cache for instant route navigation
interface InventoryMemoryCache {
  items: InventoryItem[];
  movements: InventoryMovement[];
  menuItems: MenuItem[];
  recipes: Recipe[];
  timestamp: number;
}
const inventoryCache: Record<string, InventoryMemoryCache> = {};
const INVENTORY_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export function InventoryPageClient({ outletId: propOutletId }: InventoryPageClientProps) {
  const { currentOutletId } = useOutlet();
  const outletId = propOutletId || currentOutletId || '';
  const [activeTab, setActiveTab] = useState('items');
  const cached = outletId ? inventoryCache[outletId] : undefined;
  const hasValidCache = !!(cached && Date.now() - cached.timestamp < INVENTORY_CACHE_TTL);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => cached?.items ?? []);
  const [movements, setMovements] = useState<InventoryMovement[]>(() => cached?.movements ?? []);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => cached?.menuItems ?? []);
  const [recipes, setRecipes] = useState<Recipe[]>(() => cached?.recipes ?? []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [recordMovementOpen, setRecordMovementOpen] = useState(false);
  const [wastageModalOpen, setWastageModalOpen] = useState(false);
  const [stockCountOpen, setStockCountOpen] = useState(false);

  // Recipe builder state
  const [recipeBuilderOpen, setRecipeBuilderOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [recipeMenuFilter, setRecipeMenuFilter] = useState('all');
  const [recipeSearch, setRecipeSearch] = useState('');

  const fetchAll = useCallback(async (silent = false) => {
    if (!outletId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [itemsRes, movRes, menuRes, recipesRes] = await Promise.all([
        fetch(`/api/inventory/items`),
        fetch(`/api/inventory/movements?limit=200`),
        fetch(`/api/menu?outlet_id=${outletId}`),
        fetch(`/api/inventory/recipes`),
      ]);

      const [itemsData, movData, menuData, recipesData] = await Promise.all([
        itemsRes.json(),
        movRes.json(),
        menuRes.json(),
        recipesRes.json(),
      ]);

      const newItems = itemsData.items ?? [];
      const newMovements = movData.movements ?? [];
      const newMenu = menuData.items ?? [];
      const newRecipes = recipesData.recipes ?? [];

      setInventoryItems(newItems);
      setMovements(newMovements);
      setMenuItems(newMenu);
      setRecipes(newRecipes);

      // Store in memory cache
      inventoryCache[outletId] = {
        items: newItems,
        movements: newMovements,
        menuItems: newMenu,
        recipes: newRecipes,
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error('[InventoryPageClient] Fetch error:', err);
      toast.error('Failed to sync inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [outletId]);

  useEffect(() => {
    // If cache was valid on mount, trigger silent background revalidation
    if (hasValidCache) {
      fetchAll(true);
    } else {
      fetchAll(false);
    }
  }, [fetchAll, hasValidCache]);

  // Summary alerts
  const lowStockItems = inventoryItems.filter(
    (i) => i.current_stock <= i.min_stock && i.current_stock > 0
  );
  const outOfStockItems = inventoryItems.filter((i) => i.current_stock <= 0);
  const recipeCount = recipes.length;

  const getRecipeForMenuItem = (menuItemId: string) =>
    recipes.find((r) => r.menu_item_id === menuItemId);

  const filteredMenuItems = menuItems.filter((m) => {
    const hasRecipe = !!getRecipeForMenuItem(m.id);
    if (recipeMenuFilter === 'has_recipe' && !hasRecipe) return false;
    if (recipeMenuFilter === 'no_recipe' && hasRecipe) return false;
    if (recipeSearch.trim()) {
      const q = recipeSearch.toLowerCase().trim();
      return m.name.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q);
    }
    return true;
  });

  const isPageLoading = loading && inventoryItems.length === 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Page Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Inventory & Stock
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Ledger Active</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Single source of truth for stock availability, BOM recipes, and purchase receiving.
          </p>
        </div>

        {/* Global Action Button Cluster */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStockCountOpen(true)}
            className="h-8.5 px-3 text-xs font-medium rounded-xl border-border/60 bg-card/60 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock Count</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWastageModalOpen(true)}
            className="h-8.5 px-3 text-xs font-medium rounded-xl border-border/60 bg-card/60 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Wastage</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setItemFormOpen(true)}
            className="h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="h-8.5 w-8.5 p-0 rounded-xl border-border/60 bg-card/60 hover:bg-muted/80 shadow-2xs cursor-pointer"
            title="Sync inventory"
          >
            <RotateCcw className={cn('w-3.5 h-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* 2. Critical Stock Alert Banner (Subtle & Sleek) */}
      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <div className="flex-1 truncate">
            {outOfStockItems.length > 0 && (
              <span className="font-semibold text-rose-600 dark:text-rose-400 mr-2">
                {outOfStockItems.length} item{outOfStockItems.length > 1 ? 's' : ''} depleted
              </span>
            )}
            {lowStockItems.length > 0 && (
              <span>
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low on stock
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('items')}
            className="text-[11px] font-semibold underline underline-offset-2 hover:opacity-80 shrink-0 cursor-pointer"
          >
            View Low Items →
          </button>
        </div>
      )}

      {/* 3. Segmented Navigation Ribbon */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center overflow-x-auto pb-1 no-scrollbar">
          <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border/60 backdrop-blur-md h-auto inline-flex gap-1">
            <TabsTrigger
              value="dashboard"
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </TabsTrigger>

            <TabsTrigger
              value="items"
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Items Master</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-muted text-muted-foreground min-w-4 inline-flex items-center justify-center">
                {isPageLoading ? <Skeleton className="h-2 w-3" /> : inventoryItems.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="movements"
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Ledger Logs</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-muted text-muted-foreground min-w-4 inline-flex items-center justify-center">
                {isPageLoading ? <Skeleton className="h-2 w-3" /> : movements.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="recipes"
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Recipes / BOM</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-muted text-muted-foreground min-w-4 inline-flex items-center justify-center">
                {isPageLoading ? <Skeleton className="h-2 w-3" /> : recipeCount}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="purchases"
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Purchases & POs</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard / Overview Tab */}
        <TabsContent value="dashboard" className="mt-0 space-y-4">
          <InventoryDashboardView
            items={inventoryItems}
            movements={movements}
            loading={isPageLoading}
            onOpenRecordMovement={() => setRecordMovementOpen(true)}
            onOpenWastage={() => setWastageModalOpen(true)}
            onOpenStockCount={() => setStockCountOpen(true)}
            onOpenNewItem={() => setItemFormOpen(true)}
            onNavigateTab={setActiveTab}
          />
        </TabsContent>

        {/* Items Master Tab */}
        <TabsContent value="items" className="mt-0">
          <InventoryItemsTable
            items={inventoryItems}
            outletId={outletId}
            loading={isPageLoading}
            onRefetch={() => fetchAll(true)}
          />
        </TabsContent>

        {/* Movements / Ledger Tab */}
        <TabsContent value="movements" className="mt-0">
          <InventoryMovementsLog
            movements={movements}
            inventoryItems={inventoryItems}
            onRefetch={() => fetchAll(true)}
          />
        </TabsContent>

        {/* Recipes / BOM Tab */}
        <TabsContent value="recipes" className="mt-0 space-y-3">
          {/* Recipe Filter Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card/60 p-2.5 sm:p-3 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Search dish or category..."
                className="w-full h-8.5 pl-8.5 pr-8 rounded-xl border border-border/60 bg-background/80 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
              {recipeSearch && (
                <button
                  type="button"
                  onClick={() => setRecipeSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              {[
                { id: 'all', label: 'All Dishes', count: menuItems.length },
                { id: 'has_recipe', label: 'Recipe Set', count: recipeCount },
                { id: 'no_recipe', label: 'Missing Recipe', count: menuItems.length - recipeCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRecipeMenuFilter(tab.id)}
                  className={cn(
                    'h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                    recipeMenuFilter === tab.id
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-semibold opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipes Table */}
          <div className="rounded-2xl border border-border/70 overflow-hidden bg-card shadow-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Menu Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Dish Price</th>
                  <th className="px-4 py-3">BOM Recipe Status</th>
                  <th className="px-4 py-3">Ingredients Linked</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border/40 text-xs">
                {filteredMenuItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-foreground">No menu items match criteria</p>
                      <p className="text-[11px] mt-0.5">Try clearing filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMenuItems.map((menuItem) => {
                    const recipe = getRecipeForMenuItem(menuItem.id);
                    return (
                      <tr
                        key={menuItem.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground text-xs sm:text-sm">{menuItem.name}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {menuItem.category || <span className="opacity-40">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-foreground">
                          ₹{menuItem.price}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            if (!recipe) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-border/60 bg-muted/60 text-muted-foreground">
                                  No stock link
                                </span>
                              );
                            }
                            const ings = recipe.ingredients ?? (recipe as any).recipe_ingredients ?? [];
                            const isPackaged =
                              ings.length === 1 &&
                              Number(ings[0].quantity) === 1 &&
                              (ings[0].unit === 'pcs' ||
                                ings[0].unit === 'bottle' ||
                                ings[0].unit === 'can' ||
                                ings[0].unit === 'unit' ||
                                recipe.yield_unit === 'bottle' ||
                                recipe.yield_unit === 'can' ||
                                recipe.notes?.toLowerCase().includes('packaged') ||
                                recipe.notes?.toLowerCase().includes('ready-to-serve'));

                            if (isPackaged) {
                              return (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                                  <CupSoda className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                  Packaged (1:1 Stock)
                                </span>
                              );
                            }

                            return (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                ✓ Configured · Yield {recipe.yield_quantity} {recipe.yield_unit}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[11px]">
                          {(() => {
                            const ings = recipe?.ingredients ?? (recipe as any)?.recipe_ingredients ?? [];
                            if (!ings.length) return <span className="opacity-40">—</span>;

                            const isPackaged =
                              ings.length === 1 &&
                              Number(ings[0].quantity) === 1 &&
                              (ings[0].unit === 'pcs' ||
                                ings[0].unit === 'bottle' ||
                                ings[0].unit === 'can' ||
                                ings[0].unit === 'unit' ||
                                recipe?.yield_unit === 'bottle' ||
                                recipe?.yield_unit === 'can' ||
                                recipe?.notes?.toLowerCase().includes('packaged') ||
                                recipe?.notes?.toLowerCase().includes('ready-to-serve'));

                            if (isPackaged) {
                              return (
                                <span className="font-semibold text-foreground">
                                  1x {ings[0].inventory_item?.name ?? 'Stock Bottle'} ({ings[0].unit})
                                </span>
                              );
                            }

                            const names = ings
                              .map((ing: any) => ing.inventory_item?.name ?? 'Item')
                              .slice(0, 3)
                              .join(', ');
                            return names + (ings.length > 3 ? ` +${ings.length - 3} more` : '');
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(() => {
                            const cat = (menuItem.category || '').toLowerCase();
                            const isDrink =
                              cat.includes('cold drink') ||
                              cat.includes('beverage') ||
                              cat.includes('drink') ||
                              cat.includes('soda');
                            const ings = recipe?.ingredients ?? (recipe as any)?.recipe_ingredients ?? [];
                            const isPackaged =
                              recipe &&
                              ings.length === 1 &&
                              Number(ings[0].quantity) === 1 &&
                              (ings[0].unit === 'pcs' ||
                                ings[0].unit === 'bottle' ||
                                ings[0].unit === 'can' ||
                                ings[0].unit === 'unit' ||
                                recipe.yield_unit === 'bottle' ||
                                recipe.yield_unit === 'can' ||
                                recipe.notes?.toLowerCase().includes('packaged') ||
                                recipe.notes?.toLowerCase().includes('ready-to-serve'));

                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMenuItem(menuItem);
                                  setRecipeBuilderOpen(true);
                                }}
                                className="h-7 px-3 text-xs font-semibold rounded-lg border-border/60 hover:bg-muted/80 shadow-2xs gap-1.5 cursor-pointer"
                              >
                                {isPackaged || isDrink ? (
                                  <CupSoda className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                ) : (
                                  <ChefHat className="w-3.5 h-3.5 text-primary" />
                                )}
                                <span>
                                  {isPackaged
                                    ? 'Edit Stock Link'
                                    : isDrink && !recipe
                                    ? 'Link Stock'
                                    : recipe
                                    ? 'Edit Recipe'
                                    : 'Add Recipe'}
                                </span>
                              </Button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Purchases & Receiving Tab */}
        <TabsContent value="purchases" className="mt-0">
          <PurchasesManager
            inventoryItems={inventoryItems}
            outletId={outletId}
            onStockUpdated={() => fetchAll(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Global Modals */}
      <InventoryItemForm
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        outletId={outletId}
        onSuccess={() => fetchAll(true)}
      />

      <RecordMovementForm
        open={recordMovementOpen}
        onOpenChange={setRecordMovementOpen}
        inventoryItems={inventoryItems}
        outletId={outletId}
        onSuccess={() => fetchAll(true)}
      />

      <RecordWastageModal
        open={wastageModalOpen}
        onOpenChange={setWastageModalOpen}
        inventoryItems={inventoryItems}
        onSuccess={() => fetchAll(true)}
      />

      <StockCountWorkflow
        open={stockCountOpen}
        onOpenChange={setStockCountOpen}
        inventoryItems={inventoryItems}
        outletId={outletId}
        onSuccess={() => fetchAll(true)}
      />

      {selectedMenuItem && (
        <RecipeBuilder
          open={recipeBuilderOpen}
          onOpenChange={setRecipeBuilderOpen}
          menuItem={selectedMenuItem}
          inventoryItems={inventoryItems}
          existingRecipe={getRecipeForMenuItem(selectedMenuItem.id)}
          outletId={outletId}
          onSuccess={() => fetchAll(true)}
        />
      )}
    </div>
  );
}
