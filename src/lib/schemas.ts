import { z } from 'zod';
import { OrderStatus, PaymentMethod, TableStatus, QuantityType, PricingMode } from './types';

// Menu Item Schemas
export const createMenuItemSchema = z.object({
  outlet_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Price must be positive'),
  category: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  available: z.boolean().default(true),
  image_url: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? null : val),
    z.union([z.string().url('Image URL must be a valid URL'), z.null()]).optional()
  ),
  pricing_mode: z.nativeEnum(PricingMode).default(PricingMode.FIXED),
  requires_quantity: z.boolean().default(false),
  available_quantity_types: z.array(z.string()).optional().nullable().default(null),
  base_price: z.number().nonnegative().optional().nullable(),
  quarter_price: z.number().nonnegative().optional().nullable(),
  half_price: z.number().nonnegative().optional().nullable(),
  three_quarter_price: z.number().nonnegative().optional().nullable(),
  full_price: z.number().nonnegative().optional().nullable(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  category: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  available: z.boolean().optional(),
  image_url: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? null : val),
    z.union([z.string().url('Image URL must be a valid URL'), z.null()]).optional()
  ),
  pricing_mode: z.nativeEnum(PricingMode).optional(),
  requires_quantity: z.boolean().optional(),
  available_quantity_types: z.array(z.string()).optional().nullable(),
  base_price: z.number().nonnegative().optional().nullable(),
  quarter_price: z.number().nonnegative().optional().nullable(),
  half_price: z.number().nonnegative().optional().nullable(),
  three_quarter_price: z.number().nonnegative().optional().nullable(),
  full_price: z.number().nonnegative().optional().nullable(),
});

export const menuItemIdSchema = z.object({
  id: z.string().uuid(),
});

// Order Schemas
export const orderItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  quantity_type: z.nativeEnum(QuantityType).optional(),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  outlet_id: z.string().uuid(),
  table_id: z.string().uuid().optional(),
  order_type: z.enum(['DINE_IN', 'TAKEAWAY']),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  cancellation_reason: z.string().min(1, 'Cancellation reason is required when cancelling an order').optional().nullable(),
}).refine((data) => {
  // If status is CANCELLED, cancellation_reason is required
  if (data.status === OrderStatus.CANCELLED && !data.cancellation_reason) {
    return false;
  }
  return true;
}, {
  message: 'Cancellation reason is required when cancelling an order',
  path: ['cancellation_reason'],
});

export const orderIdSchema = z.object({
  id: z.string().uuid(),
});

// Table Schemas
export const createTableSchema = z.object({
  outlet_id: z.string().uuid(),
  name: z.string().min(1, 'Table name is required'),
  capacity: z.number().int().positive().optional(),
  status: z.nativeEnum(TableStatus).default(TableStatus.EMPTY),
});

export const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  status: z.nativeEnum(TableStatus).optional(),
  order_id: z.string().uuid().nullable().optional(),
});

export const tableIdSchema = z.object({
  id: z.string().uuid(),
});

// Billing Schemas
export const billRequestSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: z.nativeEnum(PaymentMethod),
  tax_rate: z.number().min(0).max(1).default(0.18), // 18% GST default
});

export const billOrderIdSchema = z.object({
  orderId: z.string().uuid(),
});

// Query Schemas
export const menuQuerySchema = z.object({
  outlet_id: z.string().uuid().optional(),
  category: z.string().optional(),
  available: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
});

export const ordersQuerySchema = z.object({
  outlet_id: z.string().uuid().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
});

export const tablesQuerySchema = z.object({
  outlet_id: z.string().uuid().optional(),
  status: z.nativeEnum(TableStatus).optional(),
});

