
# Warehouse Management System (WMS) - Update 2026

Sistem Manajemen Gudang berbasis web modern yang dirancang untuk mengelola inventaris, pesanan, pemasok, dan gudang secara efisien[cite: 14]. Dibangun menggunakan **Next.js 16** dengan arsitektur **App Router** untuk performa optimal dan skalabilitas tinggi[cite: 10].

## 🚀 Teknologi Utama

*   **Frontend**: React 19, Next.js 16 (App Router), Tailwind CSS[cite: 10].
*   **UI Components**: Shadcn UI (Radix UI) untuk antarmuka yang aksesibel dan responsif[cite: 7, 10].
*   **State Management**: Zustand (untuk autentikasi dan global state)[cite: 2, 10].
*   **Data Fetching**: SWR (Stale-While-Revalidate) untuk sinkronisasi data real-time[cite: 1, 10].
*   **Backend**: Next.js API Routes[cite: 1].
*   **Database**: MySQL dengan driver `mysql2/promise`[cite: 10, 13].
*   **Keamanan**: JWT (JSON Web Token) dengan library `jose` dan hashing password `bcryptjs`[cite: 10].

## 📦 Fitur Utama

*   **Dashboard Interaktif**: Ringkasan data inventaris dan aktivitas gudang[cite: 1, 14].
*   **Manajemen Inventaris**: Pelacakan stok barang (*on-hand* vs *on-ordered*) secara akurat[cite: 14].
*   **Sistem Pesanan (Orders)**: Alur transaksi lengkap mulai dari *Open*, *InTransit*, hingga *Verified*[cite: 14].
*   **Manajemen Multi-Gudang & Toko**: Mendukung pengelolaan banyak lokasi gudang dan cabang toko[cite: 14].
*   **Autentikasi Berbasis Peran (RBAC)**: Kontrol akses menu berdasarkan peran user (Admin, Manager, dll)[cite: 2, 14].
*   **Ekspor Laporan**: Kemampuan menghasilkan laporan dalam format PDF dan Excel[cite: 10].

## 🛠️ Persiapan Instalasi

1.  **Clone Repository**
    ```bash
    git clone [https://github.com/Shoryuuuuuuu/warehouse.git]
    cd warehouse
    ```

2.  **Instalasi Dependensi**
    Pastikan Anda sudah menginstal Node.js versi terbaru[cite: 10].
    ```bash
    npm install
    ```

3.  **Konfigurasi Database**
    *   Impor file `erd_simple_wms_2.sql` ke MySQL Anda[cite: 14].
    *   Buat file `.env` di root folder dan isi dengan kredensial berikut:
        ```env
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=password_mysql_anda
        DB_NAME=warehouse
        DB_PORT=3306
        JWT_SECRET=generate_secret_key_anda_disini
        ```

4.  **Menjalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🗄️ Skema Database

Sistem menggunakan database relasional MySQLBerikut adalah file `README.md` profesional yang disusun berdasarkan arsitektur teknologi dan fitur yang telah kita bangun untuk proyek **Warehouse Management System (WMS)** Anda.

---


**Dikembangkan oleh:** [Achmad Rivaldi Zulfah](https://github.com/Shoryuuuuuuu)  

