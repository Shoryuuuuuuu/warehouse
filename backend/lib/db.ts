import mysql from 'mysql2/promise';

// Check if we're in demo mode (no database configured)
export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL && !process.env.DB_HOST;
}

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'warehouse',
        port: Number(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
  }
  return pool;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  if (isDemoMode()) {
    console.warn('[v0] Demo mode: Database query skipped');
    return [] as unknown as T;
  }
  
  // PERBAIKAN: Gunakan .query() bukan .execute() 
  // agar MySQL tidak error saat menerima string di LIMIT/OFFSET
  const [results] = await getPool().query(sql, params);
  return results as T;
}

export async function getConnection() {
  if (isDemoMode()) {
    throw new Error('Database not configured - running in demo mode');
  }
  return getPool().getConnection();
}

export default { query, getConnection, isDemoMode };