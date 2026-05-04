import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Warehouse } from '@/backend/types';

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

    const warehouses = await query<Warehouse[]>(
      `SELECT w.*, u.full_name as created_by
       FROM warehouses w
       LEFT JOIN users u ON w.created_id = u.user_id
       WHERE w.warehouse_id = ?`,
      [id]
    );

    if (warehouses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Warehouse tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: warehouses[0],
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
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
    const { warehouseCode, warehouseName, email, phoneNumber, city, regency, address, status } = body;

    const existing = await query<Warehouse[]>(
      'SELECT warehouse_id FROM warehouses WHERE warehouse_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Warehouse tidak ditemukan' },
        { status: 404 }
      );
    }

    const duplicate = await query<Warehouse[]>(
      'SELECT warehouse_id FROM warehouses WHERE warehouse_code = ? AND warehouse_id != ?',
      [warehouseCode, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Warehouse code sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE warehouses SET warehouse_code = ?, warehouse_name = ?, email = ?, phone_number = ?, 
       city = ?, regency = ?, address = ?, status = ?, updated_id = ? WHERE warehouse_id = ?`,
      [warehouseCode, warehouseName, email || null, phoneNumber || null, city || null, regency || null, address || null, status || 'A', session.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Warehouse berhasil diupdate',
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
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

    await query('DELETE FROM warehouses WHERE warehouse_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Warehouse berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
