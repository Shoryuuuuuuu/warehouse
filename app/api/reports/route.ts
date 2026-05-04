import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId > 2) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('type') || 'orders';

    let dateFilter = '';
    const params: unknown[] = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(o.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (reportType === 'orders') {
      // Orders report
      const orders = await query(
        `SELECT o.order_id, o.order_number, o.created_at, os.status_name, 
                s.supplier_name, w.warehouse_name, u.full_name as created_by,
                (SELECT COUNT(*) FROM order_details od WHERE od.order_id = o.order_id) as item_count,
                (SELECT SUM(od.qty_ordered) FROM order_details od WHERE od.order_id = o.order_id) as total_qty
         FROM orders o
         LEFT JOIN order_statuses os ON o.order_status_id = os.order_status_id
         LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
         LEFT JOIN warehouses w ON o.warehouse_id = w.warehouse_id
         LEFT JOIN users u ON o.created_id = u.user_id
         ${dateFilter}
         ORDER BY o.created_at DESC`,
        params
      );

      // Summary stats
      const [orderCount] = await query<{ count: number }[]>(
        `SELECT COUNT(*) as count FROM orders o ${dateFilter}`,
        params
      );

      const ordersByStatus = await query(
        `SELECT os.status_name, COUNT(*) as count
         FROM orders o
         LEFT JOIN order_statuses os ON o.order_status_id = os.order_status_id
         ${dateFilter}
         GROUP BY o.order_status_id, os.status_name`,
        params
      );

      return NextResponse.json({
        success: true,
        data: {
          type: 'orders',
          records: orders,
          summary: {
            totalOrders: orderCount?.count || 0,
            ordersByStatus,
          },
        },
      });
    }

    if (reportType === 'inventory') {
      // Inventory report
      const inventory = await query(
        `SELECT i.item_name, i.description, inv.on_hand_qty, inv.on_ordered_qty,
                i.min_stock, i.max_stock, i.unit_cost, i.unit_retail,
                (inv.on_hand_qty * i.unit_cost) as total_cost_value,
                (inv.on_hand_qty * i.unit_retail) as total_retail_value,
                s.supplier_name,
                CASE 
                  WHEN inv.on_hand_qty <= i.min_stock THEN 'Low Stock'
                  WHEN inv.on_hand_qty >= i.max_stock THEN 'Overstock'
                  ELSE 'Normal'
                END as stock_status
         FROM inventory inv
         JOIN items i ON inv.item_id = i.item_id
         LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
         ORDER BY stock_status DESC, i.item_name`
      );

      const [totalItems] = await query<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM inventory'
      );
      const [lowStockCount] = await query<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM inventory inv JOIN items i ON inv.item_id = i.item_id WHERE inv.on_hand_qty <= i.min_stock'
      );
      const [totalValue] = await query<{ cost: number; retail: number }[]>(
        `SELECT SUM(inv.on_hand_qty * i.unit_cost) as cost, SUM(inv.on_hand_qty * i.unit_retail) as retail
         FROM inventory inv
         JOIN items i ON inv.item_id = i.item_id`
      );

      return NextResponse.json({
        success: true,
        data: {
          type: 'inventory',
          records: inventory,
          summary: {
            totalItems: totalItems?.count || 0,
            lowStockItems: lowStockCount?.count || 0,
            totalCostValue: totalValue?.cost || 0,
            totalRetailValue: totalValue?.retail || 0,
          },
        },
      });
    }

    if (reportType === 'suppliers') {
      // Suppliers report
      const suppliers = await query(
        `SELECT s.supplier_code, s.supplier_name, s.email, s.phone_number, s.city,
                s.is_active,
                (SELECT COUNT(*) FROM items i WHERE i.supplier_id = s.supplier_id) as item_count,
                (SELECT COUNT(*) FROM orders o WHERE o.supplier_id = s.supplier_id) as order_count
         FROM suppliers s
         ORDER BY order_count DESC`
      );

      const [activeCount] = await query<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1'
      );
      const [totalSuppliers] = await query<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM suppliers'
      );

      return NextResponse.json({
        success: true,
        data: {
          type: 'suppliers',
          records: suppliers,
          summary: {
            totalSuppliers: totalSuppliers?.count || 0,
            activeSuppliers: activeCount?.count || 0,
          },
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
