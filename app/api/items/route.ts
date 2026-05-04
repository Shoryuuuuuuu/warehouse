import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Item } from '@/backend/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    if (all) {
      const items = await query<Item[]>(
        "SELECT i.*, s.supplier_name FROM items i LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id WHERE i.status = 'A' ORDER BY i.item_name"
      );
      return NextResponse.json({ success: true, data: items });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE i.item_name LIKE ? OR i.description LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM items i ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const items = await query<Item[]>(
      `SELECT i.*, s.supplier_name, u.full_name as created_by
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
       LEFT JOIN users u ON i.created_id = u.user_id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get items error:', error);
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
    const { itemName, description, status, stdQty, minStock, maxStock, unitCost, unitRetail, supplierId } = body;

    if (!itemName || !description || !supplierId) {
      return NextResponse.json(
        { success: false, error: 'Item name, description, dan supplier harus diisi' },
        { status: 400 }
      );
    }

    const existing = await query<Item[]>(
      'SELECT item_id FROM items WHERE item_name = ?',
      [itemName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Item name sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO items (item_name, description, status, std_qty, min_stock, max_stock, unit_cost, unit_retail, supplier_id, created_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itemName, description, status || 'A', stdQty || 1, minStock || 0, maxStock || 999, unitCost || 0, unitRetail || 0, supplierId, session.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Item berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
