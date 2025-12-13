# Quantity Type and Table Creation Features

## Summary of Changes

This document outlines the end-to-end implementation of two major features:

1. **Table Creation in Order Form**: Users can now create new tables directly from the order creation dialog
2. **Quantity Type Options**: Items can now be ordered with weight-based quantity types (250gm, 500gm, 750gm, 1kg) instead of just numeric quantities

## Database Migration Required

**IMPORTANT**: Before using these features, you must run the database migration to add the `quantity_type` column to the `order_items` table.

### Migration File
Location: `src/lib/supabase/migrations/add_quantity_type.sql`

### How to Apply Migration

1. **Via Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `src/lib/supabase/migrations/add_quantity_type.sql`
   - Execute the SQL

2. **Via Supabase CLI** (if you have it set up):
   ```bash
   supabase db push
   ```

### Migration SQL
```sql
-- Add quantity_type column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS quantity_type VARCHAR(20);

-- Update existing records to have default quantity_type
UPDATE order_items 
SET quantity_type = 'FULL' 
WHERE quantity_type IS NULL;
```

## Feature 1: Table Creation in Order Form

### What Changed
- Added "Add Table" button next to the Table selector in the order form
- Users can create new tables without leaving the order creation dialog
- Tables list automatically refreshes after creation
- New tables are immediately available for selection

### Files Modified
- `src/components/forms/OrderForm.tsx`: Added table creation functionality
- `src/components/tables/OrdersTable.tsx`: Added table refresh logic
- `app/api/tables/route.ts`: Fixed response format to include `tables` array

### How It Works
1. When creating a DINE_IN order, click "Add Table" button
2. Table creation dialog opens
3. Enter table name and capacity
4. Table is created and immediately appears in the dropdown
5. Select the new table and continue with order creation

## Feature 2: Quantity Type Options

### What Changed
- Replaced numeric quantity input with quantity type selector
- Options: 250gm (Quarter), 500gm (Half), 750gm (Three Quarter), 1kg (Full)
- Quantity types are displayed in order history and receipts
- Price calculation automatically adjusts based on quantity type

### Quantity Type Multipliers
- **QUARTER (250gm)**: Price × 0.25
- **HALF (500gm)**: Price × 0.5
- **THREE_QUARTER (750gm)**: Price × 0.75
- **FULL (1kg)**: Price × 1.0

### Files Modified

#### Database & Types
- `src/lib/supabase/migrations/add_quantity_type.sql`: Database migration
- `src/lib/types.ts`: Added `QuantityType` enum and updated `OrderItem` interface
- `src/lib/schemas.ts`: Updated `orderItemSchema` to include `quantity_type`

#### API
- `app/api/orders/route.ts`: Updated to calculate prices with quantity type multipliers

#### UI Components
- `src/components/forms/OrderForm.tsx`: 
  - Replaced quantity input with quantity type selector
  - Added table creation functionality
  
- `src/components/billing/Receipt.tsx`: 
  - Displays quantity type labels (e.g., "250gm (Quarter)")
  - Calculates prices correctly based on quantity type

- `src/components/tables/OrdersTable.tsx`: 
  - Refreshes tables list after order creation

#### Utilities
- `src/lib/utils/quantity.ts`: 
  - Helper functions for quantity type labels and multipliers

### How It Works

1. **Order Creation**:
   - Select an item from the dropdown
   - Choose quantity type (250gm, 500gm, 750gm, or 1kg)
   - Quantity is automatically set to 1
   - Price is calculated as: base_price × multiplier

2. **Order History**:
   - Quantity types are displayed in receipts
   - Shows labels like "250gm (Quarter)" instead of numeric quantities

3. **Bills/Receipts**:
   - Quantity type is clearly displayed
   - Price reflects the quantity type multiplier
   - Total is calculated correctly

## Testing Checklist

- [ ] Run database migration
- [ ] Create a new table from order form
- [ ] Verify table appears in dropdown immediately
- [ ] Create order with quantity type "250gm (Quarter)"
- [ ] Create order with quantity type "500gm (Half)"
- [ ] Create order with quantity type "750gm (Three Quarter)"
- [ ] Create order with quantity type "1kg (Full)"
- [ ] Verify quantity types appear correctly in order history
- [ ] Verify quantity types appear correctly in receipts/bills
- [ ] Verify price calculations are correct for each quantity type

## Example Usage

### Creating Order with Quantity Types

1. Click "Create Order" on Orders page
2. Select "Dine In" or "Takeaway"
3. If Dine In, select or create a table
4. Click "Add Item"
5. Select menu item
6. Select quantity type (e.g., "500gm (Half)")
7. Add notes if needed
8. Click "Create Order"

### Viewing Quantity Types

- **Order History**: Quantity types are shown in the bill modal
- **Bills Page**: Quantity types are displayed in receipts
- **Receipts**: Show quantity type labels instead of numeric quantities

## Notes

- Quantity is always stored as 1 for quantity types (QUARTER, HALF, THREE_QUARTER, FULL)
- Price stored in `order_items` is the effective price (base_price × multiplier)
- Existing orders without quantity_type will default to "FULL" (1kg)
- Quantity types are only applicable to weight-based items

