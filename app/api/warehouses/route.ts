import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Warehouse } from '@/backend/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    if (all) {
      const warehouses = await query<Warehouse[]>(
        "SELECT * FROM warehouses WHERE status = 'A' ORDER BY warehouse_name"
      );
      return NextResponse.json({ success: true, data: warehouses });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE w.warehouse_code LIKE ? OR w.warehouse_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM warehouses w ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const warehouses = await query<Warehouse[]>(
      `SELECT w.*, u.full_name as created_by
       FROM warehouses w
       LEFT JOIN users u ON w.created_id = u.user_id
       ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: warehouses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId > 2) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { warehouseCode, warehouseName, email, phoneNumber, city, regency, address, status } = body;

    if (!warehouseCode || !warehouseName) {
      return NextResponse.json(
        { success: false, error: 'Warehouse code dan name harus diisi' },
        { status: 400 }
      );
    }

    const existing = await query<Warehouse[]>(
      'SELECT warehouse_id FROM warehouses WHERE warehouse_code = ?',
      [warehouseCode]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Warehouse code sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO warehouses (warehouse_code, warehouse_name, email, phone_number, city, regency, address, status, created_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [warehouseCode, warehouseName, email || null, phoneNumber || null, city || null, regency || null, address || null, status || 'A', session.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Warehouse berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
