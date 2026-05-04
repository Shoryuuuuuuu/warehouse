import { NextRequest, NextResponse } from 'next/server';
import { query, isDemoMode } from '@/backend/lib/db';
import { verifyPassword, createToken, setSession } from '@/backend/lib/auth';
import type { User, Role } from '@/backend/types';

// Demo users for preview without database
const DEMO_USERS = [
  { user_id: 1, user_name: 'admin', password: 'admin123', full_name: 'Administrator', role_id: 1, role_name: 'Super Admin' },
  { user_id: 2, user_name: 'manager', password: 'manager123', full_name: 'Warehouse Manager', role_id: 2, role_name: 'Manager' },
  { user_id: 3, user_name: 'staff', password: 'staff123', full_name: 'Staff Gudang', role_id: 3, role_name: 'Staff' },
];

export async function POST(request: NextRequest) {
  try {
    const { userName, password } = await request.json();

    if (!userName || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Demo mode - check against hardcoded users
    if (isDemoMode()) {
      const demoUser = DEMO_USERS.find(
        (u) => u.user_name === userName && u.password === password
      );

      if (!demoUser) {
        return NextResponse.json(
          { success: false, error: 'Username atau password salah' },
          { status: 401 }
        );
      }

      const token = await createToken({
        userId: demoUser.user_id,
        userName: demoUser.user_name,
        fullName: demoUser.full_name,
        roleId: demoUser.role_id,
        roleName: demoUser.role_name,
      });

      await setSession(token);

      return NextResponse.json({
        success: true,
        data: {
          userId: demoUser.user_id,
          userName: demoUser.user_name,
          fullName: demoUser.full_name,
          roleId: demoUser.role_id,
          roleName: demoUser.role_name,
          mustChangePassword: false,
        },
      });
    }

    // Production mode - use database
    const users = await query<(User & Role)[]>(
      `SELECT u.*, r.role_code, r.role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_name = ? AND u.is_active = 1`,
      [userName]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const user = users[0];

    const isValidPassword = await verifyPassword(password, user.password || '');
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Update is_login status
    await query('UPDATE users SET is_login = 1 WHERE user_id = ?', [user.user_id]);

    // Create JWT token
    const token = await createToken({
      userId: user.user_id,
      userName: user.user_name,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: user.role_name || '',
    });

    await setSession(token);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.user_id,
        userName: user.user_name,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        mustChangePassword: user.must_change_password === 1,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
