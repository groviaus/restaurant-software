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
  role: UserRole;
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

export interface MenuItem {
  id: string;
  outlet_id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  available: boolean;
  image_url?: string | null;
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
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  available?: boolean;
  image_url?: string;
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

// Inventory types
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

export interface SalesSummary {
  id: string;
  outlet_id: string;
  date: string;
  total_sales: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

