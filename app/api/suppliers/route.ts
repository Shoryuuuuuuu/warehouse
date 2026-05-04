import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/lib/db';
import { getSession } from '@/backend/lib/auth';
import type { Supplier } from '@/backend/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    if (all) {
      const suppliers = await query<Supplier[]>(
        'SELECT * FROM suppliers WHERE is_active = 1 ORDER BY supplier_name'
      );
      return NextResponse.json({ success: true, data: suppliers });
    }

    // PERBAIKAN: Pastikan dikonversi ke Number secara eksplisit
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = 'WHERE s.supplier_code LIKE ? OR s.supplier_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM suppliers s ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    // PERBAIKAN: Masukkan nilai ke variabel lokal sebelum masuk ke array params
    // Driver mysql2 terkadang error jika menerima hasil perhitungan langsung di LIMIT
    const finalLimit = limit;
    const finalOffset = offset;

    const suppliers = await query<Supplier[]>(
      `SELECT s.*, u.full_name as created_by
       FROM suppliers s
       LEFT JOIN users u ON s.created_id = u.user_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, finalLimit, finalOffset] // Pastikan hanya berisi Number
    );

    return NextResponse.json({
      success: true,
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
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

    // Role check: 1 = Super Admin, 2 = Admin[cite: 14]
    if (session.roleId > 2) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // PERBAIKAN: Sesuaikan dengan camelCase dari frontend tapi kirim snake_case ke DB jika perlu
    // Namun di sini kita tetap gunakan nama kolom sesuai ERD Anda
    const { supplierCode, supplierName, email, phoneNumber, city, regency, address, isActive } = body;

    if (!supplierCode || !supplierName) {
      return NextResponse.json(
        { success: false, error: 'Supplier code dan name harus diisi' },
        { status: 400 }
      );
    }

    // Cek duplikasi
    const existing = await query<any[]>(
      'SELECT supplier_id FROM suppliers WHERE supplier_code = ?',
      [supplierCode]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier code sudah digunakan' },
        { status: 400 }
      );
    }

    // Pastikan created_id menggunakan ID dari session[cite: 14, 26]
    await query(
      `INSERT INTO suppliers (supplier_code, supplier_name, email, phone_number, city, regency, address, is_active, created_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplierCode, 
        supplierName, 
        email || null, 
        phoneNumber || null, 
        city || null, 
        regency || null, 
        address || null, 
        isActive ? 1 : 0, 
        session.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}