'use client';

import { useState } from 'react';
import { Header } from '@/frontend/components/layout/header';
import { useApi } from '@/frontend/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { FileDown, Loader2, FileSpreadsheet, Printer } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const CHART_COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#9333ea'];

interface OrderReport {
  order_id: number;
  order_number: string;
  created_at: string;
  status_name: string;
  supplier_name: string;
  warehouse_name: string;
  created_by: string;
  item_count: number;
  total_qty: number;
}

interface InventoryReport {
  item_name: string;
  description: string;
  on_hand_qty: number;
  on_ordered_qty: number;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  unit_retail: number;
  total_cost_value: number;
  total_retail_value: number;
  supplier_name: string;
  stock_status: string;
}

interface SupplierReport {
  supplier_code: string;
  supplier_name: string;
  email: string;
  phone_number: string;
  city: string;
  is_active: number;
  item_count: number;
  order_count: number;
}

interface ReportData {
  type: string;
  records: OrderReport[] | InventoryReport[] | SupplierReport[];
  summary: Record<string, unknown>;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const params = new URLSearchParams({ type: reportType });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const { data, isLoading } = useApi<ReportData>(`/api/reports?${params.toString()}`);

  const exportToExcel = () => {
    if (!data?.records) return;

    const worksheet = XLSX.utils.json_to_sheet(data.records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderOrdersReport = () => {
    const records = data?.records as OrderReport[];
    const summary = data?.summary as { totalOrders: number; ordersByStatus: { status_name: string; count: number }[] };

    return (
      <>
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{summary?.totalOrders || 0}</p>
            </CardContent>
          </Card>
          {summary?.ordersByStatus?.map((status, index) => (
            <Card key={status.status_name}>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{status.status_name}</p>
                <p className="text-2xl font-bold" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                  {status.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        {summary?.ordersByStatus && summary.ordersByStatus.length > 0 && (
          <Card className="mb-6 print:hidden">
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status_name"
                      label
                    >
                      {summary.ordersByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records?.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.supplier_name}</TableCell>
                      <TableCell>{order.warehouse_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status_name}</Badge>
                      </TableCell>
                      <TableCell>{order.item_count}</TableCell>
                      <TableCell>{order.total_qty}</TableCell>
                      <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderInventoryReport = () => {
    const records = data?.records as InventoryReport[];
    const summary = data?.summary as {
      totalItems: number;
      lowStockItems: number;
      totalCostValue: number;
      totalRetailValue: number;
    };

    return (
      <>
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{summary?.totalItems || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-500">{summary?.lowStockItems || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Cost Value</p>
              <p className="text-2xl font-bold">Rp {(summary?.totalCostValue || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Retail Value</p>
              <p className="text-2xl font-bold">Rp {(summary?.totalRetailValue || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">On Order</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.supplier_name}</TableCell>
                      <TableCell className="text-right">{item.on_hand_qty}</TableCell>
                      <TableCell className="text-right">{item.on_ordered_qty || 0}</TableCell>
                      <TableCell className="text-right">{item.min_stock}</TableCell>
                      <TableCell className="text-right">{item.max_stock}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.stock_status === 'Low Stock'
                              ? 'destructive'
                              : item.stock_status === 'Overstock'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {item.stock_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">Rp {item.total_cost_value?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderSuppliersReport = () => {
    const records = data?.records as SupplierReport[];
    const summary = data?.summary as { totalSuppliers: number; activeSuppliers: number };

    const chartData = records?.slice(0, 10).map((s) => ({
      name: s.supplier_name.substring(0, 15),
      orders: s.order_count,
      items: s.item_count,
    }));

    return (
      <>
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Suppliers</p>
              <p className="text-2xl font-bold">{summary?.totalSuppliers || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
              <p className="text-2xl font-bold text-green-500">{summary?.activeSuppliers || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData && chartData.length > 0 && (
          <Card className="mb-6 print:hidden">
            <CardHeader>
              <CardTitle>Top Suppliers by Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#2563eb" name="Orders" />
                    <Bar dataKey="items" fill="#16a34a" name="Items" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records?.map((supplier) => (
                    <TableRow key={supplier.supplier_code}>
                      <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                      <TableCell>{supplier.supplier_name}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.phone_number || '-'}</TableCell>
                      <TableCell>{supplier.city || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{supplier.item_count}</TableCell>
                      <TableCell className="text-right">{supplier.order_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="flex flex-col">
      <Header title="Reports" description="Generate and export reports" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Report Settings</CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orders">Orders Report</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                    <SelectItem value="suppliers">Suppliers Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToExcel} disabled={!data?.records?.length}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {reportType === 'orders' && renderOrdersReport()}
            {reportType === 'inventory' && renderInventoryReport()}
            {reportType === 'suppliers' && renderSuppliersReport()}
          </>
        )}
      </div>
    </div>
  );
}
