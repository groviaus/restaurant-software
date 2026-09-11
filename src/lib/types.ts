// Core TypeScript interfaces and enums for the POS system

export enum OrderStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
}

export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  STAFF = 'staff',
}

export enum TableStatus {
  EMPTY = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  BILLED = 'BILLED',
}

// Database entity types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | string; // Allow custom role names
  role_id?: string | null; // For custom roles
  outlet_id?: string | null;
  current_outlet_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Outlet {
  id: string;
  name: string;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export enum PricingMode {
  FIXED = 'fixed',
  QUANTITY_AUTO = 'quantity_auto',
  QUANTITY_MANUAL = 'quantity_manual',
}

export interface Category {
  id: string;
  outlet_id: string;
  name: string;
  description?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

export interface MenuItem {
  id: string;
  outlet_id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  category_id?: string | null;
  available: boolean;
  image_url?: string | null;
  pricing_mode: PricingMode;
  requires_quantity: boolean;
  available_quantity_types?: QuantityType[];
  base_price?: number | null;
  quarter_price?: number | null;
  half_price?: number | null;
  three_quarter_price?: number | null;
  full_price?: number | null;
  profit_margin_percent?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  outlet_id: string;
  name: string;
  status: TableStatus;
  capacity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  outlet_id: string;
  table_id?: string | null;
  user_id: string;
  status: OrderStatus;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  payment_method?: PaymentMethod | null;
  subtotal: number;
  tax: number;
  total: number;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export enum QuantityType {
  QUARTER = 'QUARTER', // 250gm
  HALF = 'HALF', // 500gm
  THREE_QUARTER = 'THREE_QUARTER', // 750gm
  FULL = 'FULL', // 1kg
  CUSTOM = 'CUSTOM', // Custom numeric quantity
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  quantity_type?: QuantityType | null;
  price: number;
  notes?: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { item: MenuItem })[];
  table?: Table | null;
  user: User;
}

// Request/Response types
export interface CreateMenuItemRequest {
  outlet_id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available?: boolean;
  image_url?: string;
  profit_margin_percent?: number;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  available?: boolean;
  image_url?: string;
  profit_margin_percent?: number;
}

export interface CreateOrderRequest {
  outlet_id: string;
  table_id?: string;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  items: {
    item_id: string;
    quantity: number;
    quantity_type?: QuantityType;
    notes?: string;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  cancellation_reason?: string | null;
}

export interface CreateTableRequest {
  outlet_id: string;
  name: string;
  capacity?: number;
  status?: TableStatus;
}

export interface UpdateTableRequest {
  name?: string;
  capacity?: number;
  status?: TableStatus;
  order_id?: string | null;
}

export interface BillRequest {
  order_id: string;
  payment_method: PaymentMethod;
  tax_rate?: number; // Default to 0.18 (18% GST)
}

export interface BillResponse {
  order_id: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  items: (OrderItem & { item: MenuItem })[];
  created_at: string;
}

// Inventory types (legacy — kept for backward compat)
export interface Inventory {
  id: string;
  outlet_id: string;
  item_id: string;
  stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  item?: MenuItem;
}

export interface InventoryLog {
  id: string;
  outlet_id: string;
  item_id: string;
  change: number;
  reason: string;
  created_at: string;
  created_by?: string | null;
  item?: MenuItem;
}

// ============================================================
// NEW: Production-grade Inventory System Types
// ============================================================

export enum InventoryItemType {
  RAW_MATERIAL = 'raw_material',
  INGREDIENT = 'ingredient',
  PREPARED_ITEM = 'prepared_item',
  PACKAGING = 'packaging',
  OTHER = 'other',
}

export enum InventoryTransactionType {
  OPENING_STOCK = 'opening_stock',
  PURCHASE = 'purchase',
  PURCHASE_RETURN = 'purchase_return',
  SALE_CONSUMPTION = 'sale_consumption',
  WASTAGE = 'wastage',
  SPOILAGE = 'spoilage',
  DAMAGE = 'damage',
  STOCK_COUNT_ADJUSTMENT = 'stock_count_adjustment',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  PRODUCTION = 'production',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  CUSTOMER_RETURN = 'customer_return',
}

export enum StockStatus {
  HEALTHY = 'healthy',
  LOW_STOCK = 'low_stock',
  CRITICAL = 'critical',
  OUT_OF_STOCK = 'out_of_stock',
}

export interface InventoryItem {
  id: string;
  outlet_id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  item_type: InventoryItemType;
  stock_unit: string;
  purchase_unit?: string | null;
  unit_conversion_factor: number;
  current_stock: number;
  min_stock: number;
  reorder_level: number;
  par_level: number;
  cost_per_unit: number;
  active: boolean;
  supplier_name?: string | null;
  storage_location?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Derived
  stock_status?: StockStatus;
}

export interface InventoryMovement {
  id: string;
  outlet_id: string;
  inventory_item_id: string;
  transaction_type: InventoryTransactionType;
  quantity_change: number;
  unit: string;
  quantity_before: number;
  quantity_after: number;
  reason?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  reference_label?: string | null;
  created_by?: string | null;
  notes?: string | null;
  created_at: string;
  // Joined
  inventory_item?: InventoryItem;
  user?: { name: string } | null;
}

export interface Recipe {
  id: string;
  outlet_id: string;
  menu_item_id: string;
  yield_quantity: number;
  yield_unit: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  menu_item?: MenuItem;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity: number;
  unit: string;
  preparation_loss_percent: number;
  notes?: string | null;
  created_at: string;
  // Joined
  inventory_item?: InventoryItem;
}

export interface InventoryAvailability {
  menu_item_id: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'manually_unavailable' | 'no_recipe';
  portions_available: number | null;
  limiting_ingredient?: string | null;
  message?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stock Count
// ─────────────────────────────────────────────────────────────────────────────

export enum StockCountStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  FINALIZED = 'finalized',
}

export interface StockCount {
  id: string;
  outlet_id: string;
  status: StockCountStatus;
  notes?: string | null;
  counted_by?: string | null;
  finalized_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: StockCountItem[];
}

export interface StockCountItem {
  id: string;
  stock_count_id: string;
  inventory_item_id: string;
  system_quantity: number;
  physical_quantity: number | null;
  variance: number | null; // physical - system
  unit: string;
  notes?: string | null;
  inventory_item?: InventoryItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wastage
// ─────────────────────────────────────────────────────────────────────────────

export enum WastageReason {
  SPOILAGE = 'Spoilage',
  EXPIRED = 'Expired',
  OVERPRODUCTION = 'Overproduction',
  PREPARATION_WASTE = 'Preparation waste',
  DAMAGED = 'Damaged',
  DROPPED = 'Dropped',
  OTHER = 'Other',
}

// ─────────────────────────────────────────────────────────────────────────────
// Purchase Orders
// ─────────────────────────────────────────────────────────────────────────────

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface Supplier {
  id: string;
  outlet_id: string;
  name: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  notes?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  outlet_id: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date?: string | null;
  received_date?: string | null;
  notes?: string | null;
  total_amount: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string | null;
  inventory_item?: InventoryItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface InventorySettings {
  allow_negative_stock: boolean; // §20: default false
  low_stock_warning_days: number; // days before expiry to show warning
  auto_consume_on_bill: boolean; // §9: default true
}


// RBAC Types

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  name: string;
  display_name: string;
  icon?: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
  module?: Module;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface UserPermission {
  module: string;
  actions: PermissionAction[];
}

export interface SalesSummary {
  id: string;
  outlet_id: string;
  date: string;
  total_sales: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

