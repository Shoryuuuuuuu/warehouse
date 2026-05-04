import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Item } from '@/backend/types';

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

    const items = await query<Item[]>(
      `SELECT i.*, s.supplier_name, u.full_name as created_by
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
       LEFT JOIN users u ON i.created_id = u.user_id
       WHERE i.item_id = ?`,
      [id]
    );

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: items[0],
    });
  } catch (error) {
    console.error('Get item error:', error);
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
    const { itemName, description, status, stdQty, minStock, maxStock, unitCost, unitRetail, supplierId } = body;

    const existing = await query<Item[]>(
      'SELECT item_id FROM items WHERE item_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item tidak ditemukan' },
        { status: 404 }
      );
    }

    const duplicate = await query<Item[]>(
      'SELECT item_id FROM items WHERE item_name = ? AND item_id != ?',
      [itemName, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Item name sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE items SET item_name = ?, description = ?, status = ?, std_qty = ?, min_stock = ?, 
       max_stock = ?, unit_cost = ?, unit_retail = ?, supplier_id = ?, updated_id = ? WHERE item_id = ?`,
      [itemName, description, status || 'A', stdQty || 1, minStock || 0, maxStock || 999, unitCost || 0, unitRetail || 0, supplierId, session.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Item berhasil diupdate',
    });
  } catch (error) {
    console.error('Update item error:', error);
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

    await query('DELETE FROM items WHERE item_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Item berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
