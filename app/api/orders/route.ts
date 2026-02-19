import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth, requirePermission, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { createOrderSchema, ordersQuerySchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('orders', 'view');
    const supabase = await createClient();
    const profile = await getUserProfile();

    const { searchParams } = new URL(request.url);
    const query = ordersQuerySchema.parse({
      outlet_id: searchParams.get('outlet_id') || undefined,
      status: searchParams.get('status') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    let queryBuilder = supabase
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
      .order('created_at', { ascending: false });

    const effectiveOutletId = getEffectiveOutletId(profile);
    if (query.outlet_id) {
      queryBuilder = queryBuilder.eq('outlet_id', query.outlet_id);
    } else if (effectiveOutletId) {
      // Filter by user's effective outlet
      queryBuilder = queryBuilder.eq('outlet_id', effectiveOutletId);
    }

    if (query.status) {
      // Support comma-separated statuses (e.g., "COMPLETED,CANCELLED")
      const statuses = query.status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        queryBuilder = queryBuilder.eq('status', statuses[0]);
      } else if (statuses.length > 1) {
        queryBuilder = queryBuilder.in('status', statuses);
      }
    }

    if (query.start_date) {
      queryBuilder = queryBuilder.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      queryBuilder = queryBuilder.lte('created_at', query.end_date);
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 50) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('orders', 'create');
    const supabase = await createClient();
    const profile = await getUserProfile();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Get menu items to calculate prices (fetch all pricing fields to respect pricing_mode)
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, price, base_price, pricing_mode, quarter_price, half_price, three_quarter_price, full_price')
      .in('id', validatedData.items.map((item) => item.item_id));

    if (itemsError) throw itemsError;

    const itemPriceMap = new Map(
      (items || []).map((item: any) => [item.id, {
        price: Number(item.price || 0),
        base_price: Number(item.base_price || item.price || 0),
        pricing_mode: item.pricing_mode || 'fixed',
        quarter_price: Number(item.quarter_price || 0),
        half_price: Number(item.half_price || 0),
        three_quarter_price: Number(item.three_quarter_price || 0),
        full_price: Number(item.full_price || item.price || 0),
      }])
    );

    const calculateItemPrice = (itemId: string, quantity: number, quantityType?: string): number => {
      const itemData = itemPriceMap.get(itemId);
      if (!itemData) return 0;
      let unitPrice = 0;
      if (itemData.pricing_mode === 'fixed') {
        unitPrice = itemData.price;
      } else if (itemData.pricing_mode === 'quantity_auto' && quantityType && quantityType !== 'CUSTOM') {
        const multipliers: Record<string, number> = { QUARTER: 0.25, HALF: 0.5, THREE_QUARTER: 0.75, FULL: 1.0 };
        unitPrice = itemData.base_price * (multipliers[quantityType] ?? 1.0);
      } else if (itemData.pricing_mode === 'quantity_manual' && quantityType && quantityType !== 'CUSTOM') {
        switch (quantityType) {
          case 'QUARTER': unitPrice = itemData.quarter_price || 0; break;
          case 'HALF': unitPrice = itemData.half_price || 0; break;
          case 'THREE_QUARTER': unitPrice = itemData.three_quarter_price || 0; break;
          case 'FULL': default: unitPrice = itemData.full_price || itemData.price; break;
        }
      } else {
        unitPrice = itemData.price;
      }
      return unitPrice * quantity;
    };

    let subtotal = 0;
    const orderItems = validatedData.items.map((item) => {
      const effectivePrice = calculateItemPrice(item.item_id, item.quantity, item.quantity_type) / item.quantity;
      const itemTotal = effectivePrice * item.quantity;
      subtotal += itemTotal;
      return {
        item_id: item.item_id,
        quantity: item.quantity,
        quantity_type: item.quantity_type || null,
        price: effectivePrice,
        notes: item.notes || null,
      };
    });

    // Global GST: when admin disables GST, tax is never added for any role or outlet
    let taxRate = 0.18;
    const { data: globalSettings } = await supabase
      .from('global_settings')
      .select('gst_enabled, gst_percentage')
      .eq('id', 'global')
      .single();
    const gst = globalSettings as { gst_enabled?: boolean; gst_percentage?: number } | null;
    if (gst?.gst_enabled === false) {
      taxRate = 0;
    } else if (gst?.gst_enabled === true && gst?.gst_percentage != null) {
      taxRate = gst.gst_percentage / 100;
    }

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Create order
    const orderInsertData: any = {
      outlet_id: validatedData.outlet_id,
      table_id: validatedData.table_id || null,
      user_id: session.user.id,
      status: OrderStatus.NEW,
      order_type: validatedData.order_type,
      subtotal: subtotal,
      tax: tax,
      total: total,
    };
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderData = order as any;
    const orderItemsInsertData: any[] = orderItems.map((item) => ({
      ...item,
      order_id: orderData.id,
    }));
    const { error: orderItemsError } = await supabase
      .from('order_items')
      // @ts-expect-error - Supabase type inference issue
      .insert(orderItemsInsertData);

    if (orderItemsError) throw orderItemsError;

    // Update table status if dine-in
    // Use service role client to bypass RLS since order_taker role may not have table update permissions
    if (validatedData.table_id && validatedData.order_type === 'DINE_IN') {
      const tableUpdateData: any = { status: 'OCCUPIED' };
      const serviceClient = createServiceRoleClient();
      const { error: tableUpdateError } = await serviceClient
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', validatedData.table_id);
      
      if (tableUpdateError) {
        console.error('Failed to update table status:', tableUpdateError);
        // Don't fail the order creation, but log the error
        // The table status update is important but shouldn't block order creation
      }
    }

    // Fetch complete order with relations
    const { data: completeOrder, error: fetchError } = await supabase
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
      .eq('id', orderData.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

