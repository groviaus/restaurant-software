import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { orderIdSchema, orderItemSchema } from '@/lib/schemas';
import { z } from 'zod';
import { QuantityType } from '@/lib/types';

// Schema for updating order items
const updateOrderItemsSchema = z.object({
  items_to_add: z.array(orderItemSchema).optional(),
  items_to_remove: z.array(z.string().uuid()).optional(), // Array of order_item IDs to remove
  items_to_update: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity: z.number().int().positive().optional(),
    notes: z.string().optional().nullable(),
  })).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('orders', 'edit');
    const supabase = await createClient();

    // Await params in Next.js 15+
    const { id: paramsId } = await params;
    const { id } = orderIdSchema.parse({ id: paramsId });
    const body = await request.json();
    const validatedData = updateOrderItemsSchema.parse(body);

    // Get the existing order
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .eq('id', id)
      .single();

    if (orderError || !existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = existingOrder as any;

    // Check if order can be edited (not completed or cancelled)
    if (orderData.status === 'COMPLETED' || orderData.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot edit completed or cancelled orders' },
        { status: 400 }
      );
    }

    // Get menu items for price calculation
    const allItemIds = new Set<string>();
    if (validatedData.items_to_add) {
      validatedData.items_to_add.forEach(item => allItemIds.add(item.item_id));
    }
    if (orderData.order_items) {
      orderData.order_items.forEach((oi: any) => allItemIds.add(oi.item_id));
    }

    let menuItems: any[] = [];
    if (allItemIds.size > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, price, base_price, pricing_mode, available_quantity_types, quarter_price, half_price, three_quarter_price, full_price')
        .in('id', Array.from(allItemIds));

      if (itemsError) throw itemsError;
      menuItems = items || [];
    }

    const itemPriceMap = new Map(
      (menuItems || []).map((item: any) => [
        item.id,
        {
          price: Number(item.price || 0),
          base_price: Number(item.base_price || item.price || 0),
          pricing_mode: item.pricing_mode || 'fixed',
          available_quantity_types: item.available_quantity_types || [],
          quarter_price: Number(item.quarter_price || 0),
          half_price: Number(item.half_price || 0),
          three_quarter_price: Number(item.three_quarter_price || 0),
          full_price: Number(item.full_price || item.price || 0),
        },
      ])
    );

    // Helper function to calculate effective price
    const getQuantityMultiplier = (quantityType?: string) => {
      switch (quantityType) {
        case 'QUARTER': return 0.25;
        case 'HALF': return 0.5;
        case 'THREE_QUARTER': return 0.75;
        case 'FULL': return 1.0;
        default: return 1.0;
      }
    };

    const calculateItemPrice = (itemId: string, quantity: number, quantityType?: string) => {
      const itemData = itemPriceMap.get(itemId);
      if (!itemData) return 0;

      let unitPrice = 0;

      if (itemData.pricing_mode === 'fixed') {
        unitPrice = itemData.price;
      } else if (itemData.pricing_mode === 'quantity_auto' && quantityType && quantityType !== 'CUSTOM') {
        unitPrice = itemData.base_price * getQuantityMultiplier(quantityType);
      } else if (itemData.pricing_mode === 'quantity_manual' && quantityType && quantityType !== 'CUSTOM') {
        switch (quantityType) {
          case 'QUARTER':
            unitPrice = itemData.quarter_price || 0;
            break;
          case 'HALF':
            unitPrice = itemData.half_price || 0;
            break;
          case 'THREE_QUARTER':
            unitPrice = itemData.three_quarter_price || 0;
            break;
          case 'FULL':
          default:
            unitPrice = itemData.full_price || itemData.price;
            break;
        }
      } else {
        unitPrice = itemData.price;
      }

      return unitPrice * quantity;
    };

    // Remove items
    if (validatedData.items_to_remove && validatedData.items_to_remove.length > 0) {
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .in('id', validatedData.items_to_remove);

      if (deleteError) throw deleteError;
    }

    // Update existing items (quantity changes)
    if (validatedData.items_to_update && validatedData.items_to_update.length > 0) {
      for (const update of validatedData.items_to_update) {
        const existingItem = orderData.order_items?.find((oi: any) => oi.id === update.order_item_id);
        if (!existingItem) continue;

        const updateData: any = {};
        if (update.quantity !== undefined) {
          updateData.quantity = update.quantity;
        }
        if (update.notes !== undefined) {
          updateData.notes = update.notes;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('order_items')
            // @ts-expect-error - Supabase type inference issue
            .update(updateData)
            .eq('id', update.order_item_id);

          if (updateError) throw updateError;
        }
      }
    }

    // Add new items
    if (validatedData.items_to_add && validatedData.items_to_add.length > 0) {
      const newOrderItems = validatedData.items_to_add.map((item) => {
        const effectivePrice = calculateItemPrice(item.item_id, item.quantity, item.quantity_type);
        return {
          order_id: id,
          item_id: item.item_id,
          quantity: item.quantity,
          quantity_type: item.quantity_type || null,
          price: effectivePrice,
          notes: item.notes || null,
        };
      });

      const { error: insertError } = await supabase
        .from('order_items')
        // @ts-expect-error - Supabase type inference issue
        .insert(newOrderItems);

      if (insertError) throw insertError;
    }

    // Recalculate order totals
    const { data: updatedOrderItems, error: itemsFetchError } = await supabase
      .from('order_items')
      .select('quantity, price')
      .eq('order_id', id);

    if (itemsFetchError) throw itemsFetchError;

    let subtotal = 0;
    (updatedOrderItems || []).forEach((item: any) => {
      subtotal += Number(item.price) * Number(item.quantity);
    });

    // Get global GST settings
    let taxRate = 0.18; // Default 18% GST
    const { data: globalSettings } = await supabase
      .from('global_settings')
      .select('gst_enabled, gst_percentage')
      .eq('id', 'global')
      .single();

    const settings = globalSettings as { gst_enabled?: boolean; gst_percentage?: number } | null;
    if (settings) {
      if (!settings.gst_enabled) {
        taxRate = 0;
      } else if (settings.gst_percentage) {
        taxRate = settings.gst_percentage / 100;
      }
    }

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Update order totals
    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('orders')
      // @ts-expect-error - Supabase type inference issue
      .update({
        subtotal,
        tax,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        order_items (
          *,
          items (*)
        ),
        tables (*),
        users (*)
      `)
      .single();

    if (updateOrderError) throw updateOrderError;

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    console.error('Error updating order items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order items' },
      { status: 500 }
    );
  }
}

