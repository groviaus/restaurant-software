import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { createTableSchema, tablesQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletIdParam = searchParams.get('outlet_id');
    
    // Allow public access if outlet_id is provided (for QR menu)
    // Otherwise require view permission
    if (!outletIdParam) {
      await requirePermission('tables', 'view');
    }
    
    const supabase = await createClient();

    const query = tablesQuerySchema.parse({
      outlet_id: outletIdParam,
      status: searchParams.get('status'),
    });

    let queryBuilder = supabase
      .from('tables')
      .select('*')
      .order('name', { ascending: true });

    if (query.outlet_id) {
      queryBuilder = queryBuilder.eq('outlet_id', query.outlet_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const { data: tables, error } = await queryBuilder;

    if (error) throw error;

    // Validate and fix table statuses: if a table is OCCUPIED but has no active orders, set it to EMPTY
    if (tables && tables.length > 0) {
      const tableIds = tables.map((t: any) => t.id);
      
      // Check for active orders (not COMPLETED or CANCELLED) for each table
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('table_id, status')
        .in('table_id', tableIds)
        .in('status', ['NEW', 'PREPARING', 'READY', 'SERVED'])
        .eq('order_type', 'DINE_IN');

      // Get set of table IDs that have active orders
      const tablesWithActiveOrders = new Set(
        (activeOrders || []).map((order: any) => order.table_id)
      );

      // Update tables that are marked OCCUPIED but have no active orders
      const tablesToUpdate: string[] = [];
      for (const table of tables) {
        const tableData = table as any;
        if (
          tableData.status === 'OCCUPIED' &&
          !tablesWithActiveOrders.has(tableData.id)
        ) {
          tablesToUpdate.push(tableData.id);
          // Update in-memory data
          tableData.status = 'EMPTY';
        }
      }

      // Batch update tables in database
      if (tablesToUpdate.length > 0) {
        await supabase
          .from('tables')
          // @ts-expect-error - Supabase type inference issue
          .update({ status: 'EMPTY' })
          .in('id', tablesToUpdate);
      }
    }

    return NextResponse.json({ tables: tables || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('tables', 'create');
    const supabase = await createClient();

    const body = await request.json();
    const validatedData = createTableSchema.parse(body);

    const insertData: any = validatedData;
    const { data, error } = await supabase
      .from('tables')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create table' },
      { status: 500 }
    );
  }
}

