import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Supplier } from '@/backend/types';

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

    const suppliers = await query<Supplier[]>(
      `SELECT s.*, u.full_name as created_by
       FROM suppliers s
       LEFT JOIN users u ON s.created_id = u.user_id
       WHERE s.supplier_id = ?`,
      [id]
    );

    if (suppliers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: suppliers[0],
    });
  } catch (error) {
    console.error('Get supplier error:', error);
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
    const { supplierCode, supplierName, email, phoneNumber, city, regency, address, isActive } = body;

    const existing = await query<Supplier[]>(
      'SELECT supplier_id FROM suppliers WHERE supplier_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier tidak ditemukan' },
        { status: 404 }
      );
    }

    const duplicate = await query<Supplier[]>(
      'SELECT supplier_id FROM suppliers WHERE supplier_code = ? AND supplier_id != ?',
      [supplierCode, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier code sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE suppliers SET supplier_code = ?, supplier_name = ?, email = ?, phone_number = ?, 
       city = ?, regency = ?, address = ?, is_active = ?, updated_id = ? WHERE supplier_id = ?`,
      [supplierCode, supplierName, email || null, phoneNumber || null, city || null, regency || null, address || null, isActive ? 1 : 0, session.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil diupdate',
    });
  } catch (error) {
    console.error('Update supplier error:', error);
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

    await query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
