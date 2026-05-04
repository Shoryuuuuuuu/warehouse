import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession, hashPassword } from '@/backend/lib/auth';
import type { User } from '@/backend/types';

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

    const users = await query<User[]>(
      `SELECT u.user_id, u.user_name, u.full_name, u.role_id, u.is_active, 
              u.must_change_password, u.is_login, u.created_at, u.updated_at,
              r.role_name, r.role_code
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
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
    const { userName, fullName, password, roleId, isActive } = body;

    // Check if user exists
    const existing = await query<User[]>(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if username is taken by another user
    const duplicate = await query<User[]>(
      'SELECT user_id FROM users WHERE user_name = ? AND user_id != ?',
      [userName, id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      await query(
        `UPDATE users SET user_name = ?, full_name = ?, password = ?, role_id = ?, is_active = ? 
         WHERE user_id = ?`,
        [userName, fullName, hashedPassword, roleId, isActive ? 1 : 0, id]
      );
    } else {
      await query(
        `UPDATE users SET user_name = ?, full_name = ?, role_id = ?, is_active = ? 
         WHERE user_id = ?`,
        [userName, fullName, roleId, isActive ? 1 : 0, id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil diupdate',
    });
  } catch (error) {
    console.error('Update user error:', error);
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

    // Only Super Admin can delete
    if (session.roleId !== 1) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-delete
    if (parseInt(id) === session.userId) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      );
    }

    await query('DELETE FROM users WHERE user_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
