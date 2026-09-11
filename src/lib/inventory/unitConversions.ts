/**
 * Unit conversion utilities for inventory system.
 * Converts between common recipe/stock units.
 */

/** All supported unit groups */
export const UNIT_GROUPS = {
  weight: ['g', 'kg', 'mg', 'lb', 'oz'],
  volume: ['ml', 'l', 'cl', 'fl oz', 'cup', 'tbsp', 'tsp'],
  count: ['pcs', 'unit', 'dozen', 'pack'],
  length: ['cm', 'm', 'inch'],
} as const;

/** Base unit for each group (everything is stored/compared in base units) */
const BASE_UNITS: Record<string, string> = {
  g: 'g', kg: 'g', mg: 'g', lb: 'g', oz: 'g',
  ml: 'ml', l: 'ml', cl: 'ml', 'fl oz': 'ml', cup: 'ml', tbsp: 'ml', tsp: 'ml',
  pcs: 'pcs', unit: 'pcs', dozen: 'pcs', pack: 'pcs',
};

/** Conversion factors to base unit */
const TO_BASE: Record<string, number> = {
  // Weight → grams
  g: 1,
  kg: 1000,
  mg: 0.001,
  lb: 453.592,
  oz: 28.3495,
  // Volume → ml
  ml: 1,
  l: 1000,
  cl: 10,
  'fl oz': 29.5735,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  // Count → pcs
  pcs: 1,
  unit: 1,
  dozen: 12,
  pack: 1,
};

/**
 * Convert a quantity from one unit to another.
 * Returns null if the units are incompatible (e.g., g → ml).
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();

  if (from === to) return quantity;

  const fromBase = BASE_UNITS[from];
  const toBase = BASE_UNITS[to];

  // Units must be in the same group
  if (!fromBase || !toBase || fromBase !== toBase) return null;

  const fromFactor = TO_BASE[from];
  const toFactor = TO_BASE[to];

  if (!fromFactor || !toFactor) return null;

  // Convert: quantity → base → target
  return (quantity * fromFactor) / toFactor;
}

/**
 * Convert a quantity to base unit for a given unit.
 */
export function toBaseUnit(quantity: number, unit: string): number {
  const factor = TO_BASE[unit.toLowerCase()] ?? 1;
  return quantity * factor;
}

/**
 * Get the base unit for a given unit string.
 */
export function getBaseUnit(unit: string): string {
  return BASE_UNITS[unit.toLowerCase()] ?? unit.toLowerCase();
}

/**
 * Check if two units are compatible (same group).
 */
export function unitsCompatible(unitA: string, unitB: string): boolean {
  const baseA = BASE_UNITS[unitA.toLowerCase()];
  const baseB = BASE_UNITS[unitB.toLowerCase()];
  return !!baseA && !!baseB && baseA === baseB;
}

/**
 * Format stock quantity with unit for display.
 * Automatically shows kg instead of 1000g, etc.
 */
export function formatStockDisplay(quantity: number, unit: string): string {
  const u = unit.toLowerCase();

  // Weight auto-formatting
  if (u === 'g' && quantity >= 1000) {
    return `${(quantity / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
  }
  if (u === 'ml' && quantity >= 1000) {
    return `${(quantity / 1000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }

  // Generic
  const formatted = Number.isInteger(quantity)
    ? quantity.toString()
    : quantity.toFixed(3).replace(/\.?0+$/, '');
  return `${formatted} ${unit}`;
}

/** Common unit options for form selects */
export const WEIGHT_UNITS = ['g', 'kg', 'mg', 'oz', 'lb'];
export const VOLUME_UNITS = ['ml', 'l', 'cl', 'tbsp', 'tsp', 'cup'];
export const COUNT_UNITS = ['pcs', 'unit', 'dozen', 'pack'];
export const ALL_UNITS = [...WEIGHT_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS];
