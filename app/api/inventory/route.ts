import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Inventory } from '@/backend/types';

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
    const lowStock = searchParams.get('lowStock') === 'true';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE i.item_name LIKE ? OR i.description LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (lowStock) {
      whereClause += whereClause ? ' AND inv.on_hand_qty <= i.min_stock' : 'WHERE inv.on_hand_qty <= i.min_stock';
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total 
       FROM inventory inv 
       JOIN items i ON inv.item_id = i.item_id 
       ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const inventory = await query<Inventory[]>(
      `SELECT inv.*, i.item_name, i.description, i.min_stock, i.max_stock, i.unit_cost, i.unit_retail
       FROM inventory inv
       JOIN items i ON inv.item_id = i.item_id
       ${whereClause}
       ORDER BY inv.last_updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: inventory,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get inventory error:', error);
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
    const { itemId, onHandQty, onOrderedQty } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item harus dipilih' },
        { status: 400 }
      );
    }

    // Check if inventory for this item already exists
    const existing = await query<Inventory[]>(
      'SELECT inventory_id FROM inventory WHERE item_id = ?',
      [itemId]
    );

    if (existing.length > 0) {
      // Update existing
      await query(
        'UPDATE inventory SET on_hand_qty = ?, on_ordered_qty = ? WHERE item_id = ?',
        [onHandQty || 0, onOrderedQty || 0, itemId]
      );
    } else {
      // Insert new
      await query(
        'INSERT INTO inventory (item_id, on_hand_qty, on_ordered_qty) VALUES (?, ?, ?)',
        [itemId, onHandQty || 0, onOrderedQty || 0]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory berhasil diupdate',
    });
  } catch (error) {
    console.error('Create/Update inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
