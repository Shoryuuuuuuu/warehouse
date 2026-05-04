import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Order, OrderDetail } from '@/backend/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const orders = await query<Order[]>(
      `SELECT o.*, w.warehouse_name, s.supplier_name, os.status_name, u.full_name as created_by
       FROM orders o
       LEFT JOIN warehouses w ON o.warehouse_id = w.warehouse_id
       LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
       LEFT JOIN order_statuses os ON o.order_status_id = os.order_status_id
       LEFT JOIN users u ON o.created_id = u.user_id
       WHERE o.order_id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }

    const details = await query<OrderDetail[]>(
      `SELECT od.*, i.item_name, i.description as item_description
       FROM order_details od
       LEFT JOIN items i ON od.item_id = i.item_id
       WHERE od.order_id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...orders[0],
        details,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId > 2) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { orderStatusId } = body;

    const existing = await query<Order[]>(
      'SELECT order_id FROM orders WHERE order_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }

    await query(
      'UPDATE orders SET order_status_id = ?, last_updated_id = ? WHERE order_id = ?',
      [orderStatusId, session.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Order berhasil diupdate',
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 1) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Delete order details first
    await query('DELETE FROM order_details WHERE order_id = ?', [id]);
    // Then delete order
    await query('DELETE FROM orders WHERE order_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Order berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
