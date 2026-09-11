/**
 * Centralized Inventory Service
 *
 * Single source of truth for:
 *  1. Menu item availability (portions from recipe + current stock)
 *  2. Inventory consumption on order completion (idempotent)
 *  3. Ledger movement recording (never silently modifies stock)
 *
 * IMPORTANT: All stock mutations go through `recordMovement` — this ensures
 * an audit trail always exists before `current_stock` is updated.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  InventoryItem,
  InventoryTransactionType,
  InventoryAvailability,
  RecipeIngredient,
} from '@/lib/types';
import { toBaseUnit, getBaseUnit, convertUnit } from './unitConversions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RecordMovementParams {
  outletId: string;
  inventoryItemId: string;
  transactionType: InventoryTransactionType;
  quantityChange: number; // positive = in, negative = out
  unit: string;
  reason?: string;
  referenceType?: string; // 'order' | 'purchase' | 'wastage' | 'stock_count' | 'manual'
  referenceId?: string;
  referenceLabel?: string; // Human-readable: "Order #1042"
  createdBy?: string;
  notes?: string;
  supabase: SupabaseClient;
}

export interface ConsumeForOrderParams {
  orderId: string;
  orderLabel: string; // e.g. "Order #42"
  orderItems: Array<{ item_id: string; quantity: number; quantity_type?: string }>;
  outletId: string;
  userId?: string;
  supabase: SupabaseClient;
}

export interface AvailabilityResult {
  [menuItemId: string]: InventoryAvailability;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: Record a ledger movement
// ─────────────────────────────────────────────────────────────────────────────

export async function recordMovement(params: RecordMovementParams): Promise<void> {
  const {
    outletId,
    inventoryItemId,
    transactionType,
    quantityChange,
    unit,
    reason,
    referenceType,
    referenceId,
    referenceLabel,
    createdBy,
    notes,
    supabase,
  } = params;

  // 1. Fetch current stock
  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('current_stock, stock_unit')
    .eq('id', inventoryItemId)
    .single();

  if (fetchError || !item) {
    throw new Error(`Inventory item not found: ${inventoryItemId}`);
  }

  const currentItem = item as { current_stock: number; stock_unit: string };
  const quantityBefore = Number(currentItem.current_stock);

  // Convert quantity to stock unit if needed
  let changeInStockUnit = quantityChange;
  if (unit.toLowerCase() !== currentItem.stock_unit.toLowerCase()) {
    const converted = convertUnit(quantityChange, unit, currentItem.stock_unit);
    if (converted === null) {
      // Units incompatible — store as-is (user error, but don't silently fail)
      console.warn(
        `[InventoryService] Cannot convert ${unit} → ${currentItem.stock_unit}. Storing raw value.`
      );
    } else {
      changeInStockUnit = converted;
    }
  }

  const quantityAfter = quantityBefore + changeInStockUnit;

  // 2. Insert movement (ledger entry)
  const { error: movError } = await supabase.from('inventory_movements').insert({
    outlet_id: outletId,
    inventory_item_id: inventoryItemId,
    transaction_type: transactionType,
    quantity_change: changeInStockUnit,
    unit: currentItem.stock_unit,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    reason: reason ?? null,
    reference_type: referenceType ?? null,
    reference_id: referenceId ?? null,
    reference_label: referenceLabel ?? null,
    created_by: createdBy ?? null,
    notes: notes ?? null,
  });

  if (movError) {
    throw new Error(`Failed to record inventory movement: ${movError.message}`);
  }

  // 3. Update current_stock (derived cache)
  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ current_stock: quantityAfter, updated_at: new Date().toISOString() })
    .eq('id', inventoryItemId);

  if (updateError) {
    throw new Error(`Failed to update inventory stock: ${updateError.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: Calculate available portions for a menu item
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a menu item's recipe ingredients, calculate how many portions
 * can be made from current stock.
 *
 * Returns: { portions: number | null, limitingIngredient: string | null }
 */
async function calculatePortions(
  ingredients: RecipeIngredient[],
  yieldQuantity: number,
  supabase: SupabaseClient
): Promise<{ portions: number | null; limitingIngredient: string | null }> {
  if (!ingredients.length) return { portions: null, limitingIngredient: null };

  let minPortions: number | null = null;
  let limitingIngredient: string | null = null;

  for (const ing of ingredients) {
    const { data: invItem } = await supabase
      .from('inventory_items')
      .select('current_stock, stock_unit, name')
      .eq('id', ing.inventory_item_id)
      .single();

    if (!invItem) continue;

    const stockItem = invItem as { current_stock: number; stock_unit: string; name: string };
    const currentStock = Number(stockItem.current_stock);

    // Convert recipe quantity to stock unit
    const recipeQty = Number(ing.quantity);
    const lossMultiplier = 1 + Number(ing.preparation_loss_percent ?? 0) / 100;
    const effectiveQtyPerPortion = (recipeQty * lossMultiplier) / Number(yieldQuantity);

    let effectiveQtyInStockUnit = effectiveQtyPerPortion;
    if (ing.unit.toLowerCase() !== stockItem.stock_unit.toLowerCase()) {
      const converted = convertUnit(effectiveQtyPerPortion, ing.unit, stockItem.stock_unit);
      if (converted !== null) {
        effectiveQtyInStockUnit = converted;
      }
    }

    if (effectiveQtyInStockUnit <= 0) continue;

    const portionsFromThis = Math.floor(currentStock / effectiveQtyInStockUnit);

    if (minPortions === null || portionsFromThis < minPortions) {
      minPortions = portionsFromThis;
      limitingIngredient = stockItem.name;
    }
  }

  return { portions: minPortions, limitingIngredient };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Get availability for multiple menu items
// ─────────────────────────────────────────────────────────────────────────────

export async function getMenuAvailability(
  menuItemIds: string[],
  outletId: string,
  supabase: SupabaseClient
): Promise<AvailabilityResult> {
  if (!menuItemIds.length) return {};

  // Fetch all recipes for the requested menu items in one query
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id,
      menu_item_id,
      yield_quantity,
      yield_unit,
      recipe_ingredients (
        id,
        inventory_item_id,
        quantity,
        unit,
        preparation_loss_percent,
        inventory_item:inventory_items (
          id,
          name,
          current_stock,
          stock_unit,
          min_stock
        )
      )
    `)
    .eq('outlet_id', outletId)
    .in('menu_item_id', menuItemIds);

  const result: AvailabilityResult = {};

  // Items without a recipe: no_recipe
  for (const id of menuItemIds) {
    if (!recipes?.find((r: any) => r.menu_item_id === id)) {
      result[id] = {
        menu_item_id: id,
        status: 'no_recipe',
        portions_available: null,
        message: 'No recipe configured',
      };
    }
  }

  // Process each recipe
  for (const recipe of recipes ?? []) {
    const r = recipe as any;
    const ingredients: RecipeIngredient[] = r.recipe_ingredients ?? [];

    if (!ingredients.length) {
      result[r.menu_item_id] = {
        menu_item_id: r.menu_item_id,
        status: 'no_recipe',
        portions_available: null,
        message: 'Recipe has no ingredients',
      };
      continue;
    }

    let minPortions: number | null = null;
    let limitingIngredient: string | null = null;

    for (const ing of ingredients) {
      const invItem = (ing as any).inventory_item;
      if (!invItem) continue;

      const currentStock = Number(invItem.current_stock);
      const recipeQty = Number(ing.quantity);
      const lossMultiplier = 1 + Number(ing.preparation_loss_percent ?? 0) / 100;
      const effectiveQtyPerPortion =
        (recipeQty * lossMultiplier) / Number(r.yield_quantity);

      let effectiveQtyInStockUnit = effectiveQtyPerPortion;
      if (ing.unit.toLowerCase() !== invItem.stock_unit.toLowerCase()) {
        const converted = convertUnit(effectiveQtyPerPortion, ing.unit, invItem.stock_unit);
        if (converted !== null) effectiveQtyInStockUnit = converted;
      }

      if (effectiveQtyInStockUnit <= 0) continue;

      const portionsFromThis = Math.floor(currentStock / effectiveQtyInStockUnit);

      if (minPortions === null || portionsFromThis < minPortions) {
        minPortions = portionsFromThis;
        limitingIngredient = invItem.name;
      }
    }

    const portions = minPortions ?? 0;

    // Determine status
    let status: InventoryAvailability['status'];
    let message: string | undefined;

    if (portions <= 0) {
      status = 'out_of_stock';
      message = limitingIngredient
        ? `${limitingIngredient} is out of stock`
        : 'Insufficient ingredients';
    } else if (portions <= 3) {
      status = 'low_stock';
      message = `Only ${portions} portion${portions === 1 ? '' : 's'} remaining`;
    } else {
      status = 'available';
    }

    result[r.menu_item_id] = {
      menu_item_id: r.menu_item_id,
      status,
      portions_available: portions,
      limiting_ingredient: limitingIngredient,
      message,
    };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Idempotent inventory consumption on order completion
// ─────────────────────────────────────────────────────────────────────────────

export async function consumeForOrder(params: ConsumeForOrderParams): Promise<{
  consumed: boolean;
  skipped: boolean;
  itemsConsumed: number;
  errors: string[];
}> {
  const { orderId, orderLabel, orderItems, outletId, userId, supabase } = params;

  // Idempotency check: if movements already exist for this order, skip
  const { data: existing, error: checkError } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('reference_type', 'order')
    .eq('reference_id', orderId)
    .eq('transaction_type', InventoryTransactionType.SALE_CONSUMPTION)
    .limit(1);

  if (checkError) {
    console.warn('[InventoryService] Idempotency check failed:', checkError.message);
  }

  if (existing && existing.length > 0) {
    return { consumed: false, skipped: true, itemsConsumed: 0, errors: [] };
  }

  const errors: string[] = [];
  let itemsConsumed = 0;

  for (const orderItem of orderItems) {
    if (!orderItem.item_id) continue;

    try {
      // Find recipe for this menu item
      const { data: recipe } = await supabase
        .from('recipes')
        .select(`
          id,
          yield_quantity,
          recipe_ingredients (
            inventory_item_id,
            quantity,
            unit,
            preparation_loss_percent
          )
        `)
        .eq('outlet_id', outletId)
        .eq('menu_item_id', orderItem.item_id)
        .single();

      if (!recipe) {
        // No recipe = no inventory consumption (item not tracked)
        continue;
      }

      const recipeData = recipe as any;
      const ingredients = recipeData.recipe_ingredients ?? [];
      
      // Calculate effective portion multiplier from quantity_type if present
      let portionMultiplier = 1;
      if (orderItem.quantity_type === 'HALF') {
        portionMultiplier = 0.5;
      } else if (orderItem.quantity_type === 'QUARTER') {
        portionMultiplier = 0.25;
      } else if (orderItem.quantity_type === 'THREE_QUARTER') {
        portionMultiplier = 0.75;
      }

      const portionsOrdered = Number(orderItem.quantity) * portionMultiplier;

      for (const ing of ingredients) {
        // Effective quantity = (recipe qty / yield) * portions ordered * (1 + loss%)
        const lossMultiplier = 1 + Number(ing.preparation_loss_percent ?? 0) / 100;
        const totalQty =
          (Number(ing.quantity) / Number(recipeData.yield_quantity)) *
          portionsOrdered *
          lossMultiplier;

        await recordMovement({
          outletId,
          inventoryItemId: ing.inventory_item_id,
          transactionType: InventoryTransactionType.SALE_CONSUMPTION,
          quantityChange: -totalQty, // negative = stock out
          unit: ing.unit,
          reason: `Sale consumption — ${orderLabel}`,
          referenceType: 'order',
          referenceId: orderId,
          referenceLabel: orderLabel,
          createdBy: userId,
          supabase,
        });

        itemsConsumed++;
      }
    } catch (err: any) {
      console.error(`[InventoryService] Failed to consume for item ${orderItem.item_id}:`, err);
      errors.push(`${orderItem.item_id}: ${err.message}`);
    }
  }

  return { consumed: true, skipped: false, itemsConsumed, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Reverse consumption (for order cancellation/void)
// ─────────────────────────────────────────────────────────────────────────────

export async function reverseOrderConsumption(
  orderId: string,
  orderLabel: string,
  outletId: string,
  userId: string | undefined,
  supabase: SupabaseClient
): Promise<{ reversed: boolean; itemsReversed: number }> {
  // Idempotency check: if this order was already reversed, skip to avoid duplicate returns
  const { data: alreadyReversed, error: revCheckError } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('reference_type', 'order_reversal')
    .eq('reference_id', orderId)
    .limit(1);

  if (revCheckError) {
    console.warn('[InventoryService] Reversal idempotency check failed:', revCheckError.message);
  }

  if (alreadyReversed && alreadyReversed.length > 0) {
    console.log(`[InventoryService] Order ${orderId} already reversed — skipping duplicate refund`);
    return { reversed: false, itemsReversed: 0 };
  }

  // Find original consumption movements
  const { data: originalMovements } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('reference_type', 'order')
    .eq('reference_id', orderId)
    .eq('transaction_type', InventoryTransactionType.SALE_CONSUMPTION);

  if (!originalMovements || originalMovements.length === 0) {
    return { reversed: false, itemsReversed: 0 };
  }

  let itemsReversed = 0;

  for (const mov of originalMovements) {
    const m = mov as any;
    try {
      await recordMovement({
        outletId,
        inventoryItemId: m.inventory_item_id,
        transactionType: InventoryTransactionType.CUSTOMER_RETURN,
        quantityChange: Math.abs(Number(m.quantity_change)), // positive = stock back in
        unit: m.unit,
        reason: `Reversal — ${orderLabel} cancelled`,
        referenceType: 'order_reversal',
        referenceId: orderId,
        referenceLabel: orderLabel,
        createdBy: userId,
        notes: `Reversing movement ${m.id}`,
        supabase,
      });
      itemsReversed++;
    } catch (err: any) {
      console.error(`[InventoryService] Reversal failed for movement ${m.id}:`, err);
    }
  }

  return { reversed: true, itemsReversed };
}
