'use client';

import { useState } from 'react';
import { Header } from '@/frontend/components/layout/header';
import { DataTable } from '@/frontend/components/ui/data-table';
import { ConfirmDialog } from '@/frontend/components/ui/confirm-dialog';
import { usePaginatedApi, useApi, apiPost, apiDelete } from '@/frontend/hooks/use-api';
import { useAuthStore } from '@/frontend/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Order {
  order_id: number;
  order_number: string;
  warehouse_id: number;
  warehouse_name: string;
  supplier_id: number;
  supplier_name: string;
  delivery_start_date: string;
  delivery_end_date: string;
  order_status_id: number;
  status_name: string;
  created_by: string;
  created_at: string;
}

interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
}

interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
}

interface Item {
  item_id: number;
  item_name: string;
  description: string;
  unit_cost: number;
}

interface OrderItem {
  itemId: number;
  itemName: string;
  qtyOrdered: number;
  unitCost: number;
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: orders, total, totalPages, isLoading, mutate: refreshOrders } = usePaginatedApi<Order>(
    '/api/orders',
    page,
    10,
    search
  );

  const { data: warehouses } = useApi<Warehouse[]>('/api/warehouses?all=true');
  const { data: suppliers } = useApi<Supplier[]>('/api/suppliers?all=true');
  const { data: items } = useApi<Item[]>('/api/items?all=true');
  const { data: orderDetail } = useApi<Order & { details: { item_id: number; item_name: string; qty_ordered: number }[] }>(
    selectedOrder && isDetailDialogOpen ? `/api/orders/${selectedOrder.order_id}` : null
  );

  const [formData, setFormData] = useState({
    warehouseId: '',
    supplierId: '',
    deliveryStartDate: '',
    deliveryEndDate: '',
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({ itemId: '', qty: '1' });

  const columns = [
    { key: 'order_number', title: 'Order No.' },
    { key: 'supplier_name', title: 'Supplier' },
    { key: 'warehouse_name', title: 'Warehouse' },
    {
      key: 'delivery_start_date',
      title: 'Delivery Date',
      render: (order: Order) =>
        `${format(new Date(order.delivery_start_date), 'dd/MM/yyyy')} - ${format(new Date(order.delivery_end_date), 'dd/MM/yyyy')}`,
    },
    {
      key: 'status_name',
      title: 'Status',
      render: (order: Order) => {
        const statusColors: Record<string, string> = {
          Open: 'bg-blue-500/10 text-blue-500',
          InTransit: 'bg-yellow-500/10 text-yellow-500',
          'Receiving Started': 'bg-purple-500/10 text-purple-500',
          'Receiving Verified': 'bg-green-500/10 text-green-500',
          Cancelled: 'bg-red-500/10 text-red-500',
        };
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status_name] || ''}`}>
            {order.status_name}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (order: Order) => format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
    },
  ];

  const handleOpenDialog = () => {
    setFormData({
      warehouseId: '',
      supplierId: '',
      deliveryStartDate: '',
      deliveryEndDate: '',
    });
    setOrderItems([]);
    setNewItem({ itemId: '', qty: '1' });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.itemId) return;

    const item = items?.find((i) => i.item_id === parseInt(newItem.itemId));
    if (!item) return;

    // Check if item already exists
    if (orderItems.some((oi) => oi.itemId === item.item_id)) {
      toast.error('Item sudah ada dalam order');
      return;
    }

    setOrderItems([
      ...orderItems,
      {
        itemId: item.item_id,
        itemName: item.item_name,
        qtyOrdered: parseFloat(newItem.qty),
        unitCost: item.unit_cost,
      },
    ]);
    setNewItem({ itemId: '', qty: '1' });
  };

  const handleRemoveItem = (itemId: number) => {
    setOrderItems(orderItems.filter((item) => item.itemId !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast.error('Tambahkan minimal satu item');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        warehouseId: parseInt(formData.warehouseId),
        supplierId: parseInt(formData.supplierId),
        deliveryStartDate: formData.deliveryStartDate,
        deliveryEndDate: formData.deliveryEndDate,
        items: orderItems.map((item) => ({
          itemId: item.itemId,
          qtyOrdered: item.qtyOrdered,
        })),
      };

      const result = await apiPost('/api/orders', payload);

      if (result.success) {
        toast.success(result.message || 'Order berhasil dibuat');
        setIsDialogOpen(false);
        refreshOrders();
      } else {
        toast.error(result.error || 'Gagal membuat order');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    try {
      const result = await apiDelete(`/api/orders/${selectedOrder.order_id}`);
      if (result.success) {
        toast.success('Order berhasil dihapus');
        setIsDeleteDialogOpen(false);
        setSelectedOrder(null);
        refreshOrders();
      } else {
        toast.error(result.error || 'Gagal menghapus order');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;
  const canDelete = currentUser && currentUser.roleId === 1;

  const totalOrderValue = orderItems.reduce((sum, item) => sum + item.qtyOrdered * item.unitCost, 0);

  return (
    <div className="flex flex-col">
      <Header title="Orders" description="Manage purchase orders" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Order List</h2>
          {canEdit && (
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search orders..."
          actions={(order: Order) => (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedOrder(order);
                  setIsDetailDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        />
      </div>

      {/* Create Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
            <DialogDescription>Create a new purchase order</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {/* Order Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warehouseId">Warehouse</Label>
                  <Select
                    value={formData.warehouseId}
                    onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.warehouse_id} value={String(wh.warehouse_id)}>
                          {wh.warehouse_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((sup) => (
                        <SelectItem key={sup.supplier_id} value={String(sup.supplier_id)}>
                          {sup.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryStartDate">Delivery Start Date</Label>
                  <Input
                    id="deliveryStartDate"
                    type="date"
                    value={formData.deliveryStartDate}
                    onChange={(e) => setFormData({ ...formData, deliveryStartDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryEndDate">Delivery End Date</Label>
                  <Input
                    id="deliveryEndDate"
                    type="date"
                    value={formData.deliveryEndDate}
                    onChange={(e) => setFormData({ ...formData, deliveryEndDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Add Item */}
              <div className="space-y-4">
                <h4 className="font-medium">Order Items</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select
                      value={newItem.itemId}
                      onValueChange={(value) => setNewItem({ ...newItem, itemId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items?.map((item) => (
                          <SelectItem key={item.item_id} value={String(item.item_id)}>
                            {item.item_name} - {item.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newItem.qty}
                      onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddItem}>
                    Add
                  </Button>
                </div>

                {/* Item List */}
                {orderItems.length > 0 && (
                  <div className="rounded-lg border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">Item</th>
                          <th className="p-3 text-right text-sm font-medium">Qty</th>
                          <th className="p-3 text-right text-sm font-medium">Unit Cost</th>
                          <th className="p-3 text-right text-sm font-medium">Subtotal</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => (
                          <tr key={item.itemId} className="border-b">
                            <td className="p-3 text-sm">{item.itemName}</td>
                            <td className="p-3 text-right text-sm">{item.qtyOrdered}</td>
                            <td className="p-3 text-right text-sm">Rp {item.unitCost.toLocaleString()}</td>
                            <td className="p-3 text-right text-sm">
                              Rp {(item.qtyOrdered * item.unitCost).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.itemId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50">
                          <td colSpan={3} className="p-3 text-right font-medium">Total</td>
                          <td className="p-3 text-right font-medium">
                            Rp {totalOrderValue.toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || orderItems.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Detail</DialogTitle>
            <DialogDescription>
              {orderDetail?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="font-medium">{orderDetail?.supplier_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warehouse</p>
                <p className="font-medium">{orderDetail?.warehouse_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Period</p>
                <p className="font-medium">
                  {orderDetail && `${format(new Date(orderDetail.delivery_start_date), 'dd/MM/yyyy')} - ${format(new Date(orderDetail.delivery_end_date), 'dd/MM/yyyy')}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge>{orderDetail?.status_name}</Badge>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Items</h4>
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Item</th>
                      <th className="p-3 text-right text-sm font-medium">Qty Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail?.details?.map((detail, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-3 text-sm">{detail.item_name}</td>
                        <td className="p-3 text-right text-sm">{detail.qty_ordered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Order"
        description={`Are you sure you want to delete order "${selectedOrder?.order_number}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
