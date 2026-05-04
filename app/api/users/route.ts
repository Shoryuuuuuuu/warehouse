import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession, hashPassword } from '@/backend/lib/auth';
import type { User } from '@/backend/types';

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
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE u.user_name LIKE ? OR u.full_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const users = await query<User[]>(
      `SELECT u.user_id, u.user_name, u.full_name, u.role_id, u.is_active, 
              u.must_change_password, u.is_login, u.created_at, u.updated_at,
              r.role_name, r.role_code
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
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

    // Only Super Admin and Admin can create users
    if (session.roleId > 2) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userName, fullName, password, roleId, isActive } = body;

    if (!userName || !fullName || !password || !roleId) {
      return NextResponse.json(
        { success: false, error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await query<User[]>(
      'SELECT user_id FROM users WHERE user_name = ?',
      [userName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await query(
      `INSERT INTO users (user_name, full_name, password, role_id, is_active, must_change_password) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userName, fullName, hashedPassword, roleId, isActive ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      message: 'User berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
