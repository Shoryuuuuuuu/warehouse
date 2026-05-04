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

interface Store {
  store_id: number;
  store_code: string;
  store_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  address: string | null;
  status: 'A' | 'C';
  created_by: string;
}

export default function StoresPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: stores, total, totalPages, isLoading, mutate: refreshStores } = usePaginatedApi<Store>(
    '/api/stores',
    page,
    10,
    search
  );

  const [formData, setFormData] = useState({
    storeCode: '',
    storeName: '',
    email: '',
    phoneNumber: '',
    city: '',
    regency: '',
    address: '',
    status: 'A' as 'A' | 'C',
  });

  const columns = [
    { key: 'store_code', title: 'Code' },
    { key: 'store_name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phone_number', title: 'Phone' },
    { key: 'city', title: 'City' },
    {
      key: 'status',
      title: 'Status',
      render: (store: Store) => (
        <Badge variant={store.status === 'A' ? 'default' : 'secondary'}>
          {store.status === 'A' ? 'Active' : 'Closed'}
        </Badge>
      ),
    },
  ];

  const handleOpenDialog = (store?: Store) => {
    if (store) {
      setSelectedStore(store);
      setFormData({
        storeCode: store.store_code,
        storeName: store.store_name,
        email: store.email || '',
        phoneNumber: store.phone_number || '',
        city: store.city || '',
        regency: '',
        address: store.address || '',
        status: store.status,
      });
    } else {
      setSelectedStore(null);
      setFormData({
        storeCode: '',
        storeName: '',
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
      const result = selectedStore
        ? await apiPut(`/api/stores/${selectedStore.store_id}`, formData)
        : await apiPost('/api/stores', formData);

      if (result.success) {
        toast.success(result.message || 'Store berhasil disimpan');
        setIsDialogOpen(false);
        refreshStores();
      } else {
        toast.error(result.error || 'Gagal menyimpan store');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStore) return;

    try {
      const result = await apiDelete(`/api/stores/${selectedStore.store_id}`);
      if (result.success) {
        toast.success('Store berhasil dihapus');
        setIsDeleteDialogOpen(false);
        setSelectedStore(null);
        refreshStores();
      } else {
        toast.error(result.error || 'Gagal menghapus store');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;
  const canDelete = currentUser && currentUser.roleId === 1;

  return (
    <div className="flex flex-col">
      <Header title="Stores" description="Manage store locations" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Store List</h2>
          {canEdit && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Store
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={stores}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search stores..."
          actions={
            canEdit
              ? (store: Store) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(store)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedStore(store);
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
            <DialogTitle>{selectedStore ? 'Edit Store' : 'Add Store'}</DialogTitle>
            <DialogDescription>
              {selectedStore ? 'Update store information' : 'Create a new store'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeCode">Store Code</Label>
                <Input
                  id="storeCode"
                  value={formData.storeCode}
                  onChange={(e) => setFormData({ ...formData, storeCode: e.target.value })}
                  required
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
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
                {selectedStore ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Store"
        description={`Are you sure you want to delete store "${selectedStore?.store_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
