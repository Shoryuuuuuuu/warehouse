import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Store } from '@/backend/types';

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

    const stores = await query<Store[]>(
      `SELECT s.*, u.full_name as created_by
       FROM stores s
       LEFT JOIN users u ON s.created_id = u.user_id
       WHERE s.store_id = ?`,
      [id]
    );

    if (stores.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Store tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stores[0],
    });
  } catch (error) {
    console.error('Get store error:', error);
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
    const { storeCode, storeName, email, phoneNumber, city, regency, address, status } = body;

    const existing = await query<Store[]>(
      'SELECT store_id FROM stores WHERE store_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Store tidak ditemukan' },
        { status: 404 }
      );
    }

    const duplicate = await query<Store[]>(
      'SELECT store_id FROM stores WHERE store_code = ? AND store_id != ?',
      [storeCode, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Store code sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE stores SET store_code = ?, store_name = ?, email = ?, phone_number = ?, 
       city = ?, regency = ?, address = ?, status = ?, updated_id = ? WHERE store_id = ?`,
      [storeCode, storeName, email || null, phoneNumber || null, city || null, regency || null, address || null, status || 'A', session.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Store berhasil diupdate',
    });
  } catch (error) {
    console.error('Update store error:', error);
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

    await query('DELETE FROM stores WHERE store_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Store berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete store error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
