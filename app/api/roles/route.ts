import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Role } from '@/backend/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    if (all) {
      const roles = await query<Role[]>(
        'SELECT * FROM roles WHERE is_active = 1 ORDER BY role_id'
      );
      return NextResponse.json({ success: true, data: roles });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE role_code LIKE ? OR role_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM roles ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const roles = await query<Role[]>(
      `SELECT * FROM roles ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get roles error:', error);
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

    if (session.roleId !== 1) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { roleCode, roleName, isActive } = body;

    if (!roleCode || !roleName) {
      return NextResponse.json(
        { success: false, error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const existing = await query<Role[]>(
      'SELECT role_id FROM roles WHERE role_code = ?',
      [roleCode]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Role code sudah digunakan' },
        { status: 400 }
      );
    }

    await query(
      'INSERT INTO roles (role_code, role_name, is_active) VALUES (?, ?, ?)',
      [roleCode, roleName, isActive ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      message: 'Role berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
