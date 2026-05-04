-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Waktu pembuatan: 04 Bulan Mei 2026 pada 08.38
-- Versi server: 9.1.0
-- Versi PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `warehouse`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `inventory`
--

DROP TABLE IF EXISTS `inventory`;
CREATE TABLE IF NOT EXISTS `inventory` (
  `inventory_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` bigint UNSIGNED NOT NULL,
  `on_hand_qty` decimal(8,2) NOT NULL DEFAULT '0.00',
  `on_ordered_qty` decimal(8,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `inventory_unique` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `item_id`, `on_hand_qty`, `on_ordered_qty`, `created_at`, `last_updated_at`) VALUES
(1, 1, 300.00, 250.00, '2026-05-04 13:58:15', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `items`
--

DROP TABLE IF EXISTS `items`;
CREATE TABLE IF NOT EXISTS `items` (
  `item_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_name` char(12) NOT NULL,
  `description` varchar(200) NOT NULL,
  `status` enum('A','I','C') NOT NULL DEFAULT 'A' COMMENT 'A = Active \r\nI = Inactive (Boleh ada stock tetapi tidak boleh ada Order / Pembelian masuk dan masih bisa melakukan transfer ke toko)\r\nC = Close (Tidak boleh ada stock, Tidak boleh ada order masuk, Tidak boleh ada transfer',
  `std_qty` decimal(4,2) NOT NULL,
  `min_stock` decimal(4,2) NOT NULL DEFAULT '0.00',
  `max_stock` decimal(4,2) NOT NULL,
  `unit_cost` float(10,2) NOT NULL COMMENT 'Harga Beli',
  `unit_retail` float(12,2) NOT NULL COMMENT 'Harga Jual',
  `supplier_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int UNSIGNED NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `items_unique` (`item_name`),
  KEY `items_users_FK` (`created_id`),
  KEY `items_users_FK_1` (`updated_id`),
  KEY `items_suppliers_FK` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `items`
--

INSERT INTO `items` (`item_id`, `item_name`, `description`, `status`, `std_qty`, `min_stock`, `max_stock`, `unit_cost`, `unit_retail`, `supplier_id`, `created_at`, `created_id`, `updated_at`, `updated_id`) VALUES
(1, 'Kabel Wifi', 'kabel', 'A', 1.00, 0.00, 99.99, 30000.00, 35000.00, 2, '2026-05-04 13:58:02', 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `menus`
--

DROP TABLE IF EXISTS `menus`;
CREATE TABLE IF NOT EXISTS `menus` (
  `menu_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_sequence` varchar(5) NOT NULL,
  `menu_name` varchar(80) NOT NULL,
  `menu_icon` varchar(150) DEFAULT NULL,
  `menu_link` varchar(150) DEFAULT '#',
  `is_submenu` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`menu_id`),
  UNIQUE KEY `menus_unique` (`menu_sequence`,`menu_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` char(10) NOT NULL,
  `warehouse_id` smallint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED NOT NULL,
  `delivery_start_date` date NOT NULL,
  `delivery_end_date` date NOT NULL,
  `order_status_id` tinyint UNSIGNED NOT NULL,
  `created_id` int UNSIGNED NOT NULL,
  `approval_id` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `last_updated_id` int UNSIGNED DEFAULT NULL,
  `verified_id` int UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `orders_warehouses_FK` (`warehouse_id`),
  KEY `orders_suppliers_FK` (`supplier_id`),
  KEY `orders_order_statuses_FK` (`order_status_id`),
  KEY `orders_users_FK` (`created_id`),
  KEY `orders_users_FK_1` (`approval_id`),
  KEY `orders_users_FK_2` (`last_updated_id`),
  KEY `orders_users_FK_3` (`verified_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`order_id`, `order_number`, `warehouse_id`, `supplier_id`, `delivery_start_date`, `delivery_end_date`, `order_status_id`, `created_id`, `approval_id`, `created_at`, `last_updated_at`, `last_updated_id`, `verified_id`, `verified_at`) VALUES
(1, 'PO20260504', 1, 2, '2026-05-04', '2026-05-21', 1, 1, 1, '2026-05-04 13:58:35', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_details`
--

DROP TABLE IF EXISTS `order_details`;
CREATE TABLE IF NOT EXISTS `order_details` (
  `order_detail_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `item_id` bigint UNSIGNED NOT NULL,
  `qty_ordered` decimal(5,2) NOT NULL,
  `qty_received` decimal(5,2) DEFAULT NULL,
  `qty_cancelled` decimal(5,2) DEFAULT NULL,
  `reason_cancelled` varchar(150) DEFAULT NULL,
  `created_id` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `received_id` int UNSIGNED DEFAULT NULL,
  `last_receive_dttm` datetime DEFAULT NULL,
  PRIMARY KEY (`order_detail_id`),
  KEY `order_details_items_FK` (`item_id`),
  KEY `order_details_users_FK` (`created_id`),
  KEY `order_details_users_FK_1` (`received_id`),
  KEY `order_details_orders_FK` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `order_details`
--

INSERT INTO `order_details` (`order_detail_id`, `order_id`, `item_id`, `qty_ordered`, `qty_received`, `qty_cancelled`, `reason_cancelled`, `created_id`, `created_at`, `updated_at`, `received_id`, `last_receive_dttm`) VALUES
(1, 1, 1, 100.00, NULL, NULL, NULL, 1, '2026-05-04 13:58:35', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_statuses`
--

DROP TABLE IF EXISTS `order_statuses`;
CREATE TABLE IF NOT EXISTS `order_statuses` (
  `order_status_id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT,
  `status_code` char(5) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  PRIMARY KEY (`order_status_id`),
  UNIQUE KEY `order_statuses_unique` (`status_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `order_statuses`
--

INSERT INTO `order_statuses` (`order_status_id`, `status_code`, `status_name`) VALUES
(1, '10', 'Open'),
(2, '20', 'InTransit'),
(3, '30', 'Receiving Started'),
(4, '40', 'Receiving Verified'),
(5, '50', 'Cancelled');

-- --------------------------------------------------------

--
-- Struktur dari tabel `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_code` varchar(8) NOT NULL,
  `role_name` varchar(80) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT '1 = Active, 0 = Inactive',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `roles_unique` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `roles`
--

INSERT INTO `roles` (`role_id`, `role_code`, `role_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SUPERADM', 'Super Admin', 1, '2026-05-04 13:44:42', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `role_menus`
--

DROP TABLE IF EXISTS `role_menus`;
CREATE TABLE IF NOT EXISTS `role_menus` (
  `role_menu_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` tinyint UNSIGNED NOT NULL,
  `menu_id` smallint UNSIGNED NOT NULL,
  PRIMARY KEY (`role_menu_id`),
  UNIQUE KEY `role_menus_unique` (`menu_id`,`role_id`),
  KEY `role_menus_roles_FK` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `role_submenus`
--

DROP TABLE IF EXISTS `role_submenus`;
CREATE TABLE IF NOT EXISTS `role_submenus` (
  `role_submenu_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` tinyint UNSIGNED NOT NULL,
  `submenu_id` smallint UNSIGNED NOT NULL,
  PRIMARY KEY (`role_submenu_id`),
  UNIQUE KEY `role_submenus_unique` (`role_id`,`submenu_id`),
  KEY `role_submenus_submenus_FK` (`submenu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `stores`
--

DROP TABLE IF EXISTS `stores`;
CREATE TABLE IF NOT EXISTS `stores` (
  `store_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_code` varchar(5) NOT NULL,
  `store_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(14) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `regency` varchar(80) DEFAULT NULL,
  `address` varchar(180) DEFAULT NULL,
  `status` enum('A','C') NOT NULL DEFAULT 'A' COMMENT 'A = Active\r\nC = Close',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int UNSIGNED NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `stores_unique` (`store_code`),
  UNIQUE KEY `stores_unique_1` (`store_name`),
  KEY `stores_users_FK` (`created_id`),
  KEY `stores_users_FK_1` (`updated_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `stores`
--

INSERT INTO `stores` (`store_id`, `store_code`, `store_name`, `email`, `phone_number`, `city`, `regency`, `address`, `status`, `created_at`, `created_id`, `updated_at`, `updated_id`) VALUES
(1, '1', 'jaya abadi', 'abadi@gmail.com', '08421284545', 'surabaya', NULL, 'surabaya\n', 'A', '2026-05-04 13:57:35', 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `submenus`
--

DROP TABLE IF EXISTS `submenus`;
CREATE TABLE IF NOT EXISTS `submenus` (
  `submenu_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_id` smallint UNSIGNED NOT NULL,
  `submenu_sequence` varchar(5) NOT NULL,
  `submenu_name` varchar(80) NOT NULL,
  `submenu_icon` varchar(150) DEFAULT NULL,
  `submenu_link` varchar(150) NOT NULL DEFAULT '#',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`submenu_id`),
  UNIQUE KEY `submenus_unique` (`menu_id`,`submenu_sequence`,`submenu_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE IF NOT EXISTS `suppliers` (
  `supplier_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `supplier_code` char(10) NOT NULL,
  `supplier_name` varchar(180) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(14) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `regency` varchar(80) DEFAULT NULL,
  `address` varchar(180) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT '1 = Active\r\n0 = Inactive',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int UNSIGNED NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `suppliers_unique` (`supplier_code`),
  KEY `suppliers_users_FK` (`created_id`),
  KEY `suppliers_users_FK_1` (`updated_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `supplier_code`, `supplier_name`, `email`, `phone_number`, `city`, `regency`, `address`, `is_active`, `created_at`, `created_id`, `updated_at`, `updated_id`) VALUES
(1, '01', 'CV Makmur Berkah', 'test@gmail.com', '084212121', 'bandung', 'bandung', 'bandung 1 ', 1, '2026-05-04 13:46:56', 1, NULL, NULL),
(2, '1', 'CV Makmur Abadi', 'test@gmail.com', '08412184511', 'bandung', 'bandung', 'bandung1\n', 1, '2026-05-04 13:51:55', 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_name` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `password` text NOT NULL,
  `role_id` tinyint UNSIGNED NOT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT '1 = Active, 0 = Inactive',
  `must_change_password` tinyint(1) DEFAULT '0' COMMENT '1 = Bisa ganti / reset password ketika mau login (Artinya ketika user masukan password lama arahkan ke form ganti password).\r\n0 = Tidak di ijinkan ganti password',
  `is_login` tinyint(1) DEFAULT '0' COMMENT 'Untuk indikator user sedang login atau tidak.\r\n1 = Sedang login \r\n0 = Sudah logout',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `users_unique` (`user_name`,`role_id`,`is_active`),
  KEY `users_roles_FK` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`user_id`, `user_name`, `full_name`, `password`, `role_id`, `is_active`, `must_change_password`, `is_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Administrator Utama', '$2a$12$InQ8b2wZuObiUqZHSWR4bOVQqjqjEl.uMr6zH4oPf7DYu4F6gaskm', 1, 1, 0, 0, '2026-05-04 13:45:29', '2026-05-04 13:59:21');

-- --------------------------------------------------------

--
-- Struktur dari tabel `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE IF NOT EXISTS `warehouses` (
  `warehouse_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT,
  `warehouse_code` varchar(5) NOT NULL,
  `warehouse_name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(14) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `regency` varchar(80) DEFAULT NULL,
  `address` varchar(180) DEFAULT NULL,
  `status` enum('A','C') NOT NULL DEFAULT 'A' COMMENT 'A = Active\r\nC = Close',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int UNSIGNED NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`warehouse_id`),
  UNIQUE KEY `warehouses_unique` (`warehouse_code`),
  KEY `warehouses_users_FK` (`created_id`),
  KEY `warehouses_users_FK_1` (`updated_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `warehouses`
--

INSERT INTO `warehouses` (`warehouse_id`, `warehouse_code`, `warehouse_name`, `email`, `phone_number`, `city`, `regency`, `address`, `status`, `created_at`, `created_id`, `updated_at`, `updated_id`) VALUES
(1, '1', 'wm jaya', 'jaya@gmail.com', '08445121845', 'surabaya', NULL, 'surabaya', 'A', '2026-05-04 13:57:09', 1, NULL, NULL);

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_items_FK` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_suppliers_FK` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `items_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `items_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`);

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_order_statuses_FK` FOREIGN KEY (`order_status_id`) REFERENCES `order_statuses` (`order_status_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_suppliers_FK` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_users_FK_1` FOREIGN KEY (`approval_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_users_FK_2` FOREIGN KEY (`last_updated_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_users_FK_3` FOREIGN KEY (`verified_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_warehouses_FK` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`warehouse_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `order_details_items_FK` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `order_details_orders_FK` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `order_details_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `order_details_users_FK_1` FOREIGN KEY (`received_id`) REFERENCES `users` (`user_id`);

--
-- Ketidakleluasaan untuk tabel `role_menus`
--
ALTER TABLE `role_menus`
  ADD CONSTRAINT `role_menus_menus_FK` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `role_menus_roles_FK` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `role_submenus`
--
ALTER TABLE `role_submenus`
  ADD CONSTRAINT `role_submenus_roles_FK` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `role_submenus_submenus_FK` FOREIGN KEY (`submenu_id`) REFERENCES `submenus` (`submenu_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `stores_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`);

--
-- Ketidakleluasaan untuk tabel `submenus`
--
ALTER TABLE `submenus`
  ADD CONSTRAINT `submenus_menus_FK` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`);

--
-- Ketidakleluasaan untuk tabel `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `suppliers_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`);

--
-- Ketidakleluasaan untuk tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_roles_FK` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `warehouses_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
