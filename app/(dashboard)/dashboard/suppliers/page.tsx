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
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  address: string | null;
  is_active: number;
  created_by: string;
}

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: suppliers, total, totalPages, isLoading, mutate: refreshSuppliers } = usePaginatedApi<Supplier>(
    '/api/suppliers',
    page,
    10,
    search
  );

  const [formData, setFormData] = useState({
    supplierCode: '',
    supplierName: '',
    email: '',
    phoneNumber: '',
    city: '',
    regency: '',
    address: '',
    isActive: true,
  });

  const columns = [
    { key: 'supplier_code', title: 'Code' },
    { key: 'supplier_name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phone_number', title: 'Phone' },
    { key: 'city', title: 'City' },
    {
      key: 'is_active',
      title: 'Status',
      render: (supplier: Supplier) => (
        <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
          {supplier.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setFormData({
        supplierCode: supplier.supplier_code,
        supplierName: supplier.supplier_name,
        email: supplier.email || '',
        phoneNumber: supplier.phone_number || '',
        city: supplier.city || '',
        regency: '',
        address: supplier.address || '',
        isActive: supplier.is_active === 1,
      });
    } else {
      setSelectedSupplier(null);
      setFormData({
        supplierCode: '',
        supplierName: '',
        email: '',
        phoneNumber: '',
        city: '',
        regency: '',
        address: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = selectedSupplier
        ? await apiPut(`/api/suppliers/${selectedSupplier.supplier_id}`, formData)
        : await apiPost('/api/suppliers', formData);

      if (result.success) {
        toast.success(result.message || 'Supplier berhasil disimpan');
        setIsDialogOpen(false);
        refreshSuppliers();
      } else {
        toast.error(result.error || 'Gagal menyimpan supplier');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    try {
      const result = await apiDelete(`/api/suppliers/${selectedSupplier.supplier_id}`);
      if (result.success) {
        toast.success('Supplier berhasil dihapus');
        setIsDeleteDialogOpen(false);
        setSelectedSupplier(null);
        refreshSuppliers();
      } else {
        toast.error(result.error || 'Gagal menghapus supplier');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;
  const canDelete = currentUser && currentUser.roleId === 1;

  return (
    <div className="flex flex-col">
      <Header title="Suppliers" description="Manage supplier data" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Supplier List</h2>
          {canEdit && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={suppliers}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search suppliers..."
          actions={
            canEdit
              ? (supplier: Supplier) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(supplier)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSupplier(supplier);
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
            <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Update supplier information' : 'Create a new supplier'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplierCode">Supplier Code</Label>
                <Input
                  id="supplierCode"
                  value={formData.supplierCode}
                  onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                  required
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
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
                <Label htmlFor="regency">Regency</Label>
                <Input
                  id="regency"
                  value={formData.regency}
                  onChange={(e) => setFormData({ ...formData, regency: e.target.value })}
                />
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
              <div className="flex items-center justify-between sm:col-span-2">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSupplier ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Supplier"
        description={`Are you sure you want to delete supplier "${selectedSupplier?.supplier_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
