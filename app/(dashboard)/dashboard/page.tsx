'use client';

import { Header } from '@/frontend/components/layout/header';
import { useApi } from '@/frontend/hooks/use-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Package,
  Warehouse,
  Store,
  ShoppingCart,
  AlertTriangle,
  Truck,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalSuppliers: number;
    totalWarehouses: number;
    totalStores: number;
    totalItems: number;
    totalOrders: number;
    pendingOrders: number;
    lowStockItems: number;
  };
  recentOrders: {
    order_id: number;
    order_number: string;
    created_at: string;
    status_name: string;
    supplier_name: string;
  }[];
  ordersByStatus: {
    status_name: string;
    count: number;
  }[];
  monthlyOrders: {
    month: string;
    count: number;
  }[];
}

const CHART_COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#9333ea'];

export default function DashboardPage() {
  const { data, isLoading } = useApi<DashboardData>('/api/dashboard');

  const stats = [
    {
      title: 'Total Users',
      value: data?.stats.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Total Suppliers',
      value: data?.stats.totalSuppliers || 0,
      icon: Truck,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      title: 'Total Warehouses',
      value: data?.stats.totalWarehouses || 0,
      icon: Warehouse,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: 'Total Stores',
      value: data?.stats.totalStores || 0,
      icon: Store,
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      title: 'Total Items',
      value: data?.stats.totalItems || 0,
      icon: Package,
      color: 'bg-cyan-500/10 text-cyan-500',
    },
    {
      title: 'Total Orders',
      value: data?.stats.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-indigo-500/10 text-indigo-500',
    },
    {
      title: 'Pending Orders',
      value: data?.stats.pendingOrders || 0,
      icon: TrendingUp,
      color: 'bg-yellow-500/10 text-yellow-500',
    },
    {
      title: 'Low Stock Items',
      value: data?.stats.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-500',
    },
  ];

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" description="Overview of your warehouse management system" />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {isLoading ? '...' : stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Orders</CardTitle>
              <CardDescription>Order trends over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {data?.monthlyOrders && data.monthlyOrders.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyOrders}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No order data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Distribution of orders by their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {data?.ordersByStatus && data.ordersByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status_name"
                        label={({ status_name, percent }) =>
                          `${status_name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {data.ordersByStatus.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No order data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.supplier_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {order.status_name}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No recent orders
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
