import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { billRequestSchema } from '@/lib/schemas';
import { OrderStatus, PaymentMethod } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
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

    // Fetch outlet settings to get GST configuration
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    
    let gstEnabled = true;
    let gstPercentage = 18; // Default 18%
    
    if (effectiveOutletId) {
      const { data: settings } = await supabase
        .from('outlet_settings')
        .select('gst_enabled, gst_percentage')
        .eq('outlet_id', effectiveOutletId)
        .single();
      
      if (settings) {
        const settingsData = settings as { gst_enabled?: boolean; gst_percentage?: number } | null;
        if (settingsData) {
          gstEnabled = settingsData.gst_enabled ?? true;
          gstPercentage = settingsData.gst_percentage ?? 18;
        }
      }
    }

    // Calculate totals based on outlet settings
    const subtotal = Number(orderData.subtotal);
    // Use tax_rate from request if provided (for backward compatibility), otherwise use settings
    const taxRate = validatedData.tax_rate !== undefined 
      ? validatedData.tax_rate 
      : (gstEnabled ? gstPercentage / 100 : 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Update order with payment method and totals
    const updateData: any = {
      payment_method: validatedData.payment_method,
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
      await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', updatedOrderData.table_id);
    }

    // Auto stock deduction when order is completed via bill generation
    // (profile and effectiveOutletId already fetched above)
    if (effectiveOutletId && updatedOrderData.order_items) {
      const serviceClient = createServiceRoleClient();

      for (const orderItem of updatedOrderData.order_items) {
        // Get current inventory
        const { data: inventory } = await serviceClient
          .from('inventory')
          .select('*')
          .eq('outlet_id', effectiveOutletId)
          .eq('item_id', orderItem.item_id)
          .single();

        if (inventory) {
          const inventoryData = inventory as any;
          const newStock = inventoryData.stock - orderItem.quantity;

          // Update stock
          const stockUpdateData: any = { stock: Math.max(0, newStock) };
          await serviceClient
            .from('inventory')
            // @ts-expect-error - Supabase type inference issue
            .update(stockUpdateData)
            .eq('id', inventoryData.id);

          // Log the deduction
          const logData: any = {
            outlet_id: effectiveOutletId,
            item_id: orderItem.item_id,
            change: -orderItem.quantity,
            reason: `Order ${updatedOrderData.id} completed (bill generated)`,
            created_by: profile?.id || null,
          };
          await serviceClient
            .from('inventory_logs')
            .insert(logData);
        }
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
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate bill' },
      { status: 500 }
    );
  }
}

