import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth, checkPermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { billRequestSchema } from '@/lib/schemas';
import { OrderStatus, PaymentMethod } from '@/lib/types';
import { consumeForOrder } from '@/lib/inventory/inventoryService';

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
    
    // Global GST: when admin disables GST, tax is never added for any role or outlet
    let gstEnabled = true;
    let gstPercentage = 18;
    const { data: globalSettings } = await supabase
      .from('global_settings')
      .select('gst_enabled, gst_percentage')
      .eq('id', 'global')
      .single();
    if (globalSettings) {
      const s = globalSettings as { gst_enabled?: boolean; gst_percentage?: number };
      gstEnabled = s.gst_enabled === true; // only true when explicitly true
      gstPercentage = s.gst_percentage ?? 18;
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
    
    // When GST is disabled by admin, never add tax (ignore any client-provided tax_rate)
    const taxRate = !gstEnabled ? 0 : (validatedData.tax_rate !== undefined ? validatedData.tax_rate : gstPercentage / 100);
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

    // ─── Ledger-based Inventory Consumption ──────────────────────────────────
    // Uses the centralized inventoryService — idempotent, ledger-based.
    // If movements already exist for this order, the service skips silently.
    if (orderOutletId && updatedOrderData.order_items?.length > 0) {
      try {
        const serviceClient = createServiceRoleClient();

        // Generate a human-readable order label (use order index if available)
        const { data: orderIndexData } = await serviceClient
          .from('orders')
          .select('id')
          .eq('outlet_id', orderOutletId)
          .lte('created_at', updatedOrderData.created_at)
          .order('created_at', { ascending: true });

        const orderIndex = orderIndexData ? orderIndexData.findIndex((o: any) => o.id === validatedData.order_id) + 1 : null;
        const orderLabel = orderIndex ? `Order #${orderIndex}` : `Order ${validatedData.order_id.slice(0, 8)}`;

        const result = await consumeForOrder({
          orderId: validatedData.order_id,
          orderLabel,
          orderItems: updatedOrderData.order_items.map((oi: any) => ({
            item_id: oi.item_id,
            quantity: oi.quantity,
            quantity_type: oi.quantity_type,
          })),
          outletId: orderOutletId,
          userId: profile?.id,
          supabase: serviceClient,
        });

        if (result.skipped) {
          console.log(`[Billing] Inventory already consumed for order ${validatedData.order_id} — skipping`);
        } else if (result.errors.length > 0) {
          console.warn('[Billing] Some inventory items could not be consumed:', result.errors);
        } else {
          console.log(`[Billing] Consumed inventory for ${result.itemsConsumed} ingredient(s) — ${orderLabel}`);
        }
      } catch (inventoryError: any) {
        // Non-critical: bill is already generated. Log and continue.
        console.error('[Billing] Inventory consumption failed (non-critical):', inventoryError);
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

