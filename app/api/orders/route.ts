import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, getEffectiveOutletId } from '@/lib/auth';
import { createOrderSchema, ordersQuerySchema } from '@/lib/schemas';
import { OrderStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const supabase = await createClient();
    const profile = await getUserProfile();

    const { searchParams } = new URL(request.url);
    const query = ordersQuerySchema.parse({
      outlet_id: searchParams.get('outlet_id'),
      status: searchParams.get('status'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
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
    const session = await requireAuth();
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

    // Get menu items to calculate prices
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, price')
      .in('id', validatedData.items.map((item) => item.item_id));

    if (itemsError) throw itemsError;

    const itemPriceMap = new Map((items || []).map((item: any) => [item.id, Number(item.price)]));

    // Calculate totals with quantity type multipliers
    // For quantity types, quantity is always 1, and we multiply price by the type multiplier
    let subtotal = 0;
    const getQuantityMultiplier = (quantityType?: string) => {
      switch (quantityType) {
        case 'QUARTER': return 0.25; // 250gm
        case 'HALF': return 0.5; // 500gm
        case 'THREE_QUARTER': return 0.75; // 750gm
        case 'FULL': return 1.0; // 1kg
        default: return 1.0; // Default to full for CUSTOM or undefined
      }
    };

    const orderItems = validatedData.items.map((item) => {
      const basePrice = itemPriceMap.get(item.item_id) || 0;
      const multiplier = getQuantityMultiplier(item.quantity_type);
      // For quantity types, quantity is always 1, effective price is base_price * multiplier
      // This means: 250gm = base_price * 0.25, 500gm = base_price * 0.5, etc.
      const effectivePrice = item.quantity_type && item.quantity_type !== 'CUSTOM'
        ? basePrice * multiplier
        : basePrice;
      const itemTotal = effectivePrice * item.quantity;
      subtotal += itemTotal;
      return {
        item_id: item.item_id,
        quantity: item.quantity, // Store as-is (will be 1 for quantity types)
        quantity_type: item.quantity_type || null,
        price: effectivePrice, // Store effective price (base_price * multiplier for quantity types)
        notes: item.notes || null,
      };
    });

    // Fetch outlet settings for GST calculation
    let taxRate = 0.18; // Default 18% GST
    const { data: outletSettings } = await supabase
      .from('outlet_settings')
      .select('gst_enabled, gst_percentage')
      .eq('outlet_id', validatedData.outlet_id)
      .single();

    const settings = outletSettings as { gst_enabled?: boolean; gst_percentage?: number } | null;
    if (settings) {
      if (!settings.gst_enabled) {
        taxRate = 0;
      } else if (settings.gst_percentage) {
        taxRate = settings.gst_percentage / 100;
      }
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
    if (validatedData.table_id && validatedData.order_type === 'DINE_IN') {
      const tableUpdateData: any = { status: 'OCCUPIED' };
      await supabase
        .from('tables')
        // @ts-expect-error - Supabase type inference issue
        .update(tableUpdateData)
        .eq('id', validatedData.table_id);
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

