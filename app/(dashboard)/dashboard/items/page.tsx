'use client';

import { useState } from 'react';
import { Header } from '@/frontend/components/layout/header';
import { DataTable } from '@/frontend/components/ui/data-table';
import { ConfirmDialog } from '@/frontend/components/ui/confirm-dialog';
import { usePaginatedApi, useApi, apiPost, apiPut, apiDelete } from '@/frontend/hooks/use-api';
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

interface Item {
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
  supplier_name: string;
}

interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
}

export default function ItemsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: items, total, totalPages, isLoading, mutate: refreshItems } = usePaginatedApi<Item>(
    '/api/items',
    page,
    10,
    search
  );

  const { data: suppliers } = useApi<Supplier[]>('/api/suppliers?all=true');

  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    status: 'A' as 'A' | 'I' | 'C',
    stdQty: '1',
    minStock: '0',
    maxStock: '999',
    unitCost: '0',
    unitRetail: '0',
    supplierId: '',
  });

  const columns = [
    { key: 'item_name', title: 'Item Name' },
    { key: 'description', title: 'Description', className: 'max-w-[200px] truncate' },
    { key: 'supplier_name', title: 'Supplier' },
    {
      key: 'unit_cost',
      title: 'Cost',
      render: (item: Item) => `Rp ${item.unit_cost.toLocaleString()}`,
    },
    {
      key: 'unit_retail',
      title: 'Retail',
      render: (item: Item) => `Rp ${item.unit_retail.toLocaleString()}`,
    },
    {
      key: 'status',
      title: 'Status',
      render: (item: Item) => {
        const statusMap = {
          A: { label: 'Active', variant: 'default' as const },
          I: { label: 'Inactive', variant: 'secondary' as const },
          C: { label: 'Closed', variant: 'destructive' as const },
        };
        const status = statusMap[item.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
  ];

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        itemName: item.item_name,
        description: item.description,
        status: item.status,
        stdQty: String(item.std_qty),
        minStock: String(item.min_stock),
        maxStock: String(item.max_stock),
        unitCost: String(item.unit_cost),
        unitRetail: String(item.unit_retail),
        supplierId: String(item.supplier_id),
      });
    } else {
      setSelectedItem(null);
      setFormData({
        itemName: '',
        description: '',
        status: 'A',
        stdQty: '1',
        minStock: '0',
        maxStock: '999',
        unitCost: '0',
        unitRetail: '0',
        supplierId: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        stdQty: parseFloat(formData.stdQty),
        minStock: parseFloat(formData.minStock),
        maxStock: parseFloat(formData.maxStock),
        unitCost: parseFloat(formData.unitCost),
        unitRetail: parseFloat(formData.unitRetail),
        supplierId: parseInt(formData.supplierId),
      };

      const result = selectedItem
        ? await apiPut(`/api/items/${selectedItem.item_id}`, payload)
        : await apiPost('/api/items', payload);

      if (result.success) {
        toast.success(result.message || 'Item berhasil disimpan');
        setIsDialogOpen(false);
        refreshItems();
      } else {
        toast.error(result.error || 'Gagal menyimpan item');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const result = await apiDelete(`/api/items/${selectedItem.item_id}`);
      if (result.success) {
        toast.success('Item berhasil dihapus');
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
        refreshItems();
      } else {
        toast.error(result.error || 'Gagal menghapus item');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;
  const canDelete = currentUser && currentUser.roleId === 1;

  return (
    <div className="flex flex-col">
      <Header title="Items" description="Manage product items" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Item List</h2>
          {canEdit && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search items..."
          actions={
            canEdit
              ? (item: Item) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item);
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
            <DialogTitle>{selectedItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Update item information' : 'Create a new item'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  required
                  maxLength={12}
                />
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
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.supplier_id} value={String(supplier.supplier_id)}>
                        {supplier.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost (Rp)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitRetail">Unit Retail (Rp)</Label>
                <Input
                  id="unitRetail"
                  type="number"
                  value={formData.unitRetail}
                  onChange={(e) => setFormData({ ...formData, unitRetail: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stdQty">Standard Qty</Label>
                <Input
                  id="stdQty"
                  type="number"
                  value={formData.stdQty}
                  onChange={(e) => setFormData({ ...formData, stdQty: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'A' | 'I' | 'C') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Active</SelectItem>
                    <SelectItem value="I">Inactive</SelectItem>
                    <SelectItem value="C">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Max Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete item "${selectedItem?.item_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
