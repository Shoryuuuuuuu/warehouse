import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Order } from '@/backend/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const statusId = searchParams.get('statusId');
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE o.order_number LIKE ?';
      params.push(`%${search}%`);
    }

    if (statusId) {
      whereClause += whereClause ? ' AND o.order_status_id = ?' : 'WHERE o.order_status_id = ?';
      params.push(statusId);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const orders = await query<Order[]>(
      `SELECT o.*, w.warehouse_name, s.supplier_name, os.status_name, u.full_name as created_by
       FROM orders o
       LEFT JOIN warehouses w ON o.warehouse_id = w.warehouse_id
       LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
       LEFT JOIN order_statuses os ON o.order_status_id = os.order_status_id
       LEFT JOIN users u ON o.created_id = u.user_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const connection = await getConnection();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId > 2) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { warehouseId, supplierId, deliveryStartDate, deliveryEndDate, items } = body;

    if (!warehouseId || !supplierId || !deliveryStartDate || !deliveryEndDate || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Generate order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await connection.execute<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    const count = (countResult[0] as unknown as { count: number }[])[0]?.count || 0;
    const orderNumber = `PO${dateStr}${String(count + 1).padStart(2, '0')}`;

    // Insert order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_number, warehouse_id, supplier_id, delivery_start_date, delivery_end_date, order_status_id, created_id, approval_id) 
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [orderNumber, warehouseId, supplierId, deliveryStartDate, deliveryEndDate, session.userId, session.userId]
    );

    const orderId = (orderResult as { insertId: number }).insertId;

    // Insert order details
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await connection.execute(
        `INSERT INTO order_details (order_detail_id, order_id, item_id, qty_ordered, created_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [i + 1, orderId, item.itemId, item.qtyOrdered, session.userId]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Order berhasil dibuat',
      data: { orderId, orderNumber },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
