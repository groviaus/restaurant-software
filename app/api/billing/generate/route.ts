import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth, checkPermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { billRequestSchema } from '@/lib/schemas';
import { OrderStatus, PaymentMethod } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions for API route
    // Generating a bill is essentially completing an order, so check for orders.edit permission
    const session = await requireAuth();
    const hasPermission = await checkPermission(session.user.id, 'orders', 'edit');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied: You do not have permission to edit orders (required to generate bills)' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();

    const body = await request.json();
    const validatedData = billRequestSchema.parse(body);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          items (*)
        ),
        tables (*),
        users (*)
      `)
      .eq('id', validatedData.order_id)
      .single();

    if (orderError) throw orderError;

    const orderData = order as any;

    if (orderData.status === OrderStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Order is already completed' },
        { status: 400 }
      );
    }

    // Fetch global GST settings (same for all outlets)
    const orderOutletId = orderData.outlet_id;
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    
    let gstEnabled = true;
    let gstPercentage = 18; // Default 18%
    
    // Get global GST settings (not per-outlet)
    const { data: globalSettings } = await supabase
      .from('global_settings')
      .select('gst_enabled, gst_percentage')
      .eq('id', 'global')
      .single();
    
    if (globalSettings) {
      const settingsData = globalSettings as { gst_enabled?: boolean; gst_percentage?: number } | null;
      if (settingsData) {
        gstEnabled = settingsData.gst_enabled ?? true;
        gstPercentage = settingsData.gst_percentage ?? 18;
      }
    }

    // Calculate totals based on outlet settings
    // Calculate subtotal from order items if not present or invalid
    let subtotal = 0;
    if (orderData.subtotal != null && !isNaN(Number(orderData.subtotal))) {
      subtotal = Number(orderData.subtotal);
    } else {
      // Calculate from order items as fallback
      const orderItems = orderData.order_items || [];
      subtotal = orderItems.reduce((sum: number, item: any) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
    }
    
    // Use tax_rate from request if provided (for backward compatibility), otherwise use settings
    const taxRate = validatedData.tax_rate !== undefined 
      ? validatedData.tax_rate 
      : (gstEnabled ? gstPercentage / 100 : 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Update order with payment method and totals
    const updateData: any = {
      payment_method: validatedData.payment_method,
      subtotal: subtotal, // Update subtotal if it was calculated from items
      tax: tax,
      total: total,
      status: OrderStatus.COMPLETED,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
      .eq('id', validatedData.order_id)
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

    if (updateError) throw updateError;

    const updatedOrderData = updatedOrder as any;

    // Update table status to EMPTY if dine-in (table is now available for new orders)
    if (updatedOrderData.table_id && updatedOrderData.order_type === 'DINE_IN') {
      const tableUpdateData: any = { status: 'EMPTY' };
      const { error: tableUpdateError } = await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', updatedOrderData.table_id);
      
      if (tableUpdateError) {
        console.error('Failed to update table status to EMPTY:', tableUpdateError);
        // Don't fail the request, but log the error
      }
    }

    // Auto stock deduction when order is completed via bill generation
    // Use order's outlet_id for inventory deduction (not user's effective outlet)
    if (orderOutletId && updatedOrderData.order_items && updatedOrderData.order_items.length > 0) {
      try {
        const serviceClient = createServiceRoleClient();

        for (const orderItem of updatedOrderData.order_items) {
          if (!orderItem.item_id) {
            console.warn('[Billing] Order item missing item_id, skipping inventory deduction:', orderItem);
            continue;
          }

          // Get current inventory
          const { data: inventory, error: inventoryError } = await serviceClient
            .from('inventory')
            .select('*')
            .eq('outlet_id', orderOutletId)
            .eq('item_id', orderItem.item_id)
            .single();

          if (inventoryError && inventoryError.code !== 'PGRST116') {
            // PGRST116 is "not found" - that's okay, just log it
            console.warn('[Billing] Inventory lookup error (non-critical):', inventoryError);
            continue;
          }

          if (inventory) {
            const inventoryData = inventory as any;
            const newStock = Number(inventoryData.stock) - Number(orderItem.quantity);

            // Update stock
            const stockUpdateData: any = { stock: Math.max(0, newStock) };
            const { error: updateError } = await serviceClient
              .from('inventory')
              // @ts-expect-error - Supabase type inference issue
              .update(stockUpdateData)
              .eq('id', inventoryData.id);

            if (updateError) {
              console.warn('[Billing] Inventory update error (non-critical):', updateError);
              continue;
            }

            // Log the deduction
            const logData: any = {
              outlet_id: orderOutletId,
              item_id: orderItem.item_id,
              change: -Number(orderItem.quantity),
              reason: `Order ${updatedOrderData.id} completed (bill generated)`,
              created_by: profile?.id || null,
            };
            const { error: logError } = await serviceClient
              .from('inventory_logs')
              .insert(logData);

            if (logError) {
              console.warn('[Billing] Inventory log error (non-critical):', logError);
            }
          }
        }
      } catch (inventoryError: any) {
        console.error('[Billing] Inventory deduction failed (non-critical):', inventoryError);
        // Don't fail the bill generation if inventory update fails
      }
    }

    return NextResponse.json({
      order_id: updatedOrderData.id,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payment_method: validatedData.payment_method,
      items: updatedOrderData.order_items,
      created_at: updatedOrderData.created_at,
    });
  } catch (error: any) {
    console.error('[Billing] Error generating bill:', error);
    console.error('[Billing] Error stack:', error.stack);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    // Check if it's a permission error
    if (error.message?.includes('permission') || error.message?.includes('Permission')) {
      return NextResponse.json(
        { error: 'Permission denied: ' + (error.message || 'You do not have permission to generate bills') },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate bill' },
      { status: 500 }
    );
  }
}

