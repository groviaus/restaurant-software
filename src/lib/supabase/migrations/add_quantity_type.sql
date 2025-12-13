-- Add quantity_type column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS quantity_type VARCHAR(20);

-- Update existing records to have default quantity_type
UPDATE order_items 
SET quantity_type = 'FULL' 
WHERE quantity_type IS NULL;

-- Add comment to explain quantity_type values
COMMENT ON COLUMN order_items.quantity_type IS 'Quantity type: QUARTER (250gm), HALF (500gm), THREE_QUARTER (750gm), FULL (1kg), or CUSTOM for numeric quantities';

