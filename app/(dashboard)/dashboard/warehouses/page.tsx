'use client';

import { useState } from 'react';
import { Header } from '@/frontend/components/layout/header';
import { DataTable } from '@/frontend/components/ui/data-table';
import { ConfirmDialog } from '@/frontend/components/ui/confirm-dialog';
import { usePaginatedApi, apiPost, apiPut, apiDelete } from '@/frontend/hooks/use-api';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  address: string | null;
  status: 'A' | 'C';
  created_by: string;
}

export default function WarehousesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: warehouses, total, totalPages, isLoading, mutate: refreshWarehouses } = usePaginatedApi<Warehouse>(
    '/api/warehouses',
    page,
    10,
    search
  );

  const [formData, setFormData] = useState({
    warehouseCode: '',
    warehouseName: '',
    email: '',
    phoneNumber: '',
    city: '',
    regency: '',
    address: '',
    status: 'A' as 'A' | 'C',
  });

  const columns = [
    { key: 'warehouse_code', title: 'Code' },
    { key: 'warehouse_name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phone_number', title: 'Phone' },
    { key: 'city', title: 'City' },
    {
      key: 'status',
      title: 'Status',
      render: (warehouse: Warehouse) => (
        <Badge variant={warehouse.status === 'A' ? 'default' : 'secondary'}>
          {warehouse.status === 'A' ? 'Active' : 'Closed'}
        </Badge>
      ),
    },
  ];

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setSelectedWarehouse(warehouse);
      setFormData({
        warehouseCode: warehouse.warehouse_code,
        warehouseName: warehouse.warehouse_name,
        email: warehouse.email || '',
        phoneNumber: warehouse.phone_number || '',
        city: warehouse.city || '',
        regency: '',
        address: warehouse.address || '',
        status: warehouse.status,
      });
    } else {
      setSelectedWarehouse(null);
      setFormData({
        warehouseCode: '',
        warehouseName: '',
        email: '',
        phoneNumber: '',
        city: '',
        regency: '',
        address: '',
        status: 'A',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = selectedWarehouse
        ? await apiPut(`/api/warehouses/${selectedWarehouse.warehouse_id}`, formData)
        : await apiPost('/api/warehouses', formData);

      if (result.success) {
        toast.success(result.message || 'Warehouse berhasil disimpan');
        setIsDialogOpen(false);
        refreshWarehouses();
      } else {
        toast.error(result.error || 'Gagal menyimpan warehouse');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) return;

    try {
      const result = await apiDelete(`/api/warehouses/${selectedWarehouse.warehouse_id}`);
      if (result.success) {
        toast.success('Warehouse berhasil dihapus');
        setIsDeleteDialogOpen(false);
        setSelectedWarehouse(null);
        refreshWarehouses();
      } else {
        toast.error(result.error || 'Gagal menghapus warehouse');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;
  const canDelete = currentUser && currentUser.roleId === 1;

  return (
    <div className="flex flex-col">
      <Header title="Warehouses" description="Manage warehouse locations" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Warehouse List</h2>
          {canEdit && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={warehouses}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search warehouses..."
          actions={
            canEdit
              ? (warehouse: Warehouse) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(warehouse)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedWarehouse(warehouse);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                )
              : undefined
          }
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
            <DialogDescription>
              {selectedWarehouse ? 'Update warehouse information' : 'Create a new warehouse'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="warehouseCode">Warehouse Code</Label>
                <Input
                  id="warehouseCode"
                  value={formData.warehouseCode}
                  onChange={(e) => setFormData({ ...formData, warehouseCode: e.target.value })}
                  required
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseName">Warehouse Name</Label>
                <Input
                  id="warehouseName"
                  value={formData.warehouseName}
                  onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'A' | 'C') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Active</SelectItem>
                    <SelectItem value="C">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedWarehouse ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Warehouse"
        description={`Are you sure you want to delete warehouse "${selectedWarehouse?.warehouse_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
