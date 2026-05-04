import { NextResponse } from 'next/server';
import { query, isDemoMode } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';

// Demo data for preview
const DEMO_DATA = {
  stats: {
    totalUsers: 15,
    totalSuppliers: 8,
    totalWarehouses: 3,
    totalStores: 12,
    totalItems: 156,
    totalOrders: 89,
    pendingOrders: 5,
    lowStockItems: 7,
  },
  recentOrders: [
    { order_id: 1, order_number: 'PO-2026-0089', created_at: '2026-05-04', status_name: 'Pending', supplier_name: 'PT Supplier Utama' },
    { order_id: 2, order_number: 'PO-2026-0088', created_at: '2026-05-03', status_name: 'Processing', supplier_name: 'CV Maju Jaya' },
    { order_id: 3, order_number: 'PO-2026-0087', created_at: '2026-05-02', status_name: 'Completed', supplier_name: 'PT Sumber Makmur' },
    { order_id: 4, order_number: 'PO-2026-0086', created_at: '2026-05-01', status_name: 'Completed', supplier_name: 'UD Sukses Abadi' },
    { order_id: 5, order_number: 'PO-2026-0085', created_at: '2026-04-30', status_name: 'Completed', supplier_name: 'PT Supplier Utama' },
  ],
  ordersByStatus: [
    { status_name: 'Pending', count: 5 },
    { status_name: 'Processing', count: 12 },
    { status_name: 'Shipped', count: 8 },
    { status_name: 'Completed', count: 64 },
  ],
  monthlyOrders: [
    { month: '2025-12', count: 15 },
    { month: '2026-01', count: 18 },
    { month: '2026-02', count: 12 },
    { month: '2026-03', count: 22 },
    { month: '2026-04', count: 17 },
    { month: '2026-05', count: 5 },
  ],
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Return demo data if no database configured
    if (isDemoMode()) {
      return NextResponse.json({ success: true, data: DEMO_DATA });
    }

    // Get counts
    const [usersCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM users'
    );
    const [suppliersCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM suppliers'
    );
    const [warehousesCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM warehouses'
    );
    const [storesCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM stores'
    );
    const [itemsCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM items'
    );
    const [ordersCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM orders'
    );
    const [pendingOrdersCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM orders WHERE order_status_id IN (1, 2)'
    );
    const [lowStockCount] = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM inventory i JOIN items it ON i.item_id = it.item_id WHERE i.on_hand_qty <= it.min_stock'
    );

    // Get recent orders
    const recentOrders = await query(
      `SELECT o.order_id, o.order_number, o.created_at, os.status_name, s.supplier_name
       FROM orders o
       LEFT JOIN order_statuses os ON o.order_status_id = os.order_status_id
       LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    // Get orders by status for chart
    const ordersByStatus = await query(
      `SELECT os.status_name, COUNT(*) as count
       FROM orders o
       JOIN order_statuses os ON o.order_status_id = os.order_status_id
       GROUP BY o.order_status_id, os.status_name`
    );

    // Get monthly order stats
    const monthlyOrders = await query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers: usersCount?.count || 0,
          totalSuppliers: suppliersCount?.count || 0,
          totalWarehouses: warehousesCount?.count || 0,
          totalStores: storesCount?.count || 0,
          totalItems: itemsCount?.count || 0,
          totalOrders: ordersCount?.count || 0,
          pendingOrders: pendingOrdersCount?.count || 0,
          lowStockItems: lowStockCount?.count || 0,
        },
        recentOrders,
        ordersByStatus,
        monthlyOrders,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
