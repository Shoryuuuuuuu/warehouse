// User Types
export interface User {
  user_id: number;
  user_name: string;
  full_name: string;
  password?: string;
  role_id: number;
  is_active: number;
  must_change_password: number;
  is_login: number;
  created_at: string;
  updated_at: string | null;
  role_name?: string;
  role_code?: string;
}

// Role Types
export interface Role {
  role_id: number;
  role_code: string;
  role_name: string;
  is_active: number;
  created_at: string;
  updated_at: string | null;
}

// Supplier Types
export interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  regency: string | null;
  address: string | null;
  is_active: number;
  created_at: string;
  created_id: number;
  updated_at: string | null;
  updated_id: number | null;
  created_by?: string;
}

// Warehouse Types
export interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  regency: string | null;
  address: string | null;
  status: 'A' | 'C';
  created_at: string;
  created_id: number;
  updated_at: string | null;
  updated_id: number | null;
  created_by?: string;
}

// Store Types
export interface Store {
  store_id: number;
  store_code: string;
  store_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  regency: string | null;
  address: string | null;
  status: 'A' | 'C';
  created_at: string;
  created_id: number;
  updated_at: string | null;
  updated_id: number | null;
  created_by?: string;
}

// Item Types
export interface Item {
  item_id: number;
  item_name: string;
  description: string;
  status: 'A' | 'I' | 'C';
  std_qty: number;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  unit_retail: number;
  supplier_id: number;
  created_at: string;
  created_id: number;
  updated_at: string | null;
  updated_id: number | null;
  supplier_name?: string;
  created_by?: string;
}

// Inventory Types
export interface Inventory {
  inventory_id: number;
  item_id: number;
  on_hand_qty: number;
  on_ordered_qty: number | null;
  created_at: string;
  last_updated_at: string | null;
  item_name?: string;
  description?: string;
}

// Order Types
export interface Order {
  order_id: number;
  order_number: string;
  warehouse_id: number;
  supplier_id: number;
  delivery_start_date: string;
  delivery_end_date: string;
  order_status_id: number;
  created_id: number;
  approval_id: number;
  created_at: string;
  last_updated_at: string | null;
  last_updated_id: number | null;
  verified_id: number | null;
  verified_at: string | null;
  warehouse_name?: string;
  supplier_name?: string;
  status_name?: string;
  created_by?: string;
}

export interface OrderDetail {
  order_detail_id: number;
  order_id: number;
  item_id: number;
  qty_ordered: number;
  qty_received: number | null;
  qty_cancelled: number | null;
  reason_cancelled: string | null;
  created_id: number;
  created_at: string;
  updated_at: string | null;
  received_id: number | null;
  last_receive_dttm: string | null;
  item_name?: string;
}

export interface OrderStatus {
  order_status_id: number;
  status_code: string;
  status_name: string;
}

// Menu Types
export interface Menu {
  menu_id: number;
  menu_sequence: string;
  menu_name: string;
  menu_icon: string | null;
  menu_link: string;
  is_submenu: number;
  is_active: number;
  submenus?: Submenu[];
}

export interface Submenu {
  submenu_id: number;
  menu_id: number;
  submenu_sequence: string;
  submenu_name: string;
  submenu_icon: string | null;
  submenu_link: string;
  is_active: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalSuppliers: number;
  totalWarehouses: number;
  totalStores: number;
  totalItems: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
}
