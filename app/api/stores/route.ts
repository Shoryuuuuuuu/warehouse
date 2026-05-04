import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Store } from '@/backend/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    if (all) {
      const stores = await query<Store[]>(
        "SELECT * FROM stores WHERE status = 'A' ORDER BY store_name"
      );
      return NextResponse.json({ success: true, data: stores });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE s.store_code LIKE ? OR s.store_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM stores s ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const stores = await query<Store[]>(
      `SELECT s.*, u.full_name as created_by
       FROM stores s
       LEFT JOIN users u ON s.created_id = u.user_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: stores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get stores error:', error);
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
    const { storeCode, storeName, email, phoneNumber, city, regency, address, status } = body;

    if (!storeCode || !storeName) {
      return NextResponse.json(
        { success: false, error: 'Store code dan name harus diisi' },
        { status: 400 }
      );
    }

    const existing = await query<Store[]>(
      'SELECT store_id FROM stores WHERE store_code = ?',
      [storeCode]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Store code sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO stores (store_code, store_name, email, phone_number, city, regency, address, status, created_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [storeCode, storeName, email || null, phoneNumber || null, city || null, regency || null, address || null, status || 'A', session.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Store berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
