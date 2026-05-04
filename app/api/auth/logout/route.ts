import { NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession, clearSession } from '@/backend/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    
    if (session) {
      await query('UPDATE users SET is_login = 0 WHERE user_id = ?', [session.userId]);
    }

    await clearSession();

    return NextResponse.json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
