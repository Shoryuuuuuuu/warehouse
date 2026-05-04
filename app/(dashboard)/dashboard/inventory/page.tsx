'use client';

import { useState } from 'react';
import { Header } from '@/frontend/components/layout/header';
import { DataTable } from '@/frontend/components/ui/data-table';
import { usePaginatedApi, useApi, apiPost } from '@/frontend/hooks/use-api';
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
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  inventory_id: number;
  item_id: number;
  item_name: string;
  description: string;
  on_hand_qty: number;
  on_ordered_qty: number | null;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  unit_retail: number;
}

interface Item {
  item_id: number;
  item_name: string;
  description: string;
}

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: inventory, total, totalPages, isLoading, mutate: refreshInventory } = usePaginatedApi<InventoryItem>(
    '/api/inventory',
    page,
    10,
    search,
    showLowStock ? { lowStock: 'true' } : {}
  );

  const { data: items } = useApi<Item[]>('/api/items?all=true');

  const [formData, setFormData] = useState({
    itemId: '',
    onHandQty: '0',
    onOrderedQty: '0',
  });

  const columns = [
    { key: 'item_name', title: 'Item Name' },
    { key: 'description', title: 'Description', className: 'max-w-[200px] truncate' },
    {
      key: 'on_hand_qty',
      title: 'On Hand',
      render: (item: InventoryItem) => (
        <div className="flex items-center gap-2">
          <span>{item.on_hand_qty}</span>
          {item.on_hand_qty <= item.min_stock && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
        </div>
      ),
    },
    {
      key: 'on_ordered_qty',
      title: 'On Order',
      render: (item: InventoryItem) => item.on_ordered_qty || 0,
    },
    { key: 'min_stock', title: 'Min Stock' },
    { key: 'max_stock', title: 'Max Stock' },
    {
      key: 'status',
      title: 'Status',
      render: (item: InventoryItem) => {
        if (item.on_hand_qty <= item.min_stock) {
          return <Badge variant="destructive">Low Stock</Badge>;
        }
        if (item.on_hand_qty >= item.max_stock) {
          return <Badge variant="secondary">Overstock</Badge>;
        }
        return <Badge variant="default">Normal</Badge>;
      },
    },
    {
      key: 'value',
      title: 'Value',
      render: (item: InventoryItem) => `Rp ${(item.on_hand_qty * item.unit_cost).toLocaleString()}`,
    },
  ];

  const handleOpenDialog = () => {
    setFormData({
      itemId: '',
      onHandQty: '0',
      onOrderedQty: '0',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        itemId: parseInt(formData.itemId),
        onHandQty: parseFloat(formData.onHandQty),
        onOrderedQty: parseFloat(formData.onOrderedQty),
      };

      const result = await apiPost('/api/inventory', payload);

      if (result.success) {
        toast.success(result.message || 'Inventory berhasil diupdate');
        setIsDialogOpen(false);
        refreshInventory();
      } else {
        toast.error(result.error || 'Gagal mengupdate inventory');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;

  return (
    <div className="flex flex-col">
      <Header title="Inventory" description="Manage stock levels" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Inventory List</h2>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Low Stock Only
            </Button>
          </div>
          {canEdit && (
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Update Inventory
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={inventory}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search inventory..."
        />
      </div>

      {/* Update Inventory Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update stock levels for an item
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemId">Item</Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(value) => setFormData({ ...formData, itemId: value })}
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
              <div className="space-y-2">
                <Label htmlFor="onHandQty">On Hand Quantity</Label>
                <Input
                  id="onHandQty"
                  type="number"
                  value={formData.onHandQty}
                  onChange={(e) => setFormData({ ...formData, onHandQty: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onOrderedQty">On Order Quantity</Label>
                <Input
                  id="onOrderedQty"
                  type="number"
                  value={formData.onOrderedQty}
                  onChange={(e) => setFormData({ ...formData, onOrderedQty: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.itemId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
