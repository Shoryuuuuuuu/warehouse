'use client';

import { useState } from 'react';
import { Header } from '@/frontend/components/layout/header';
import { DataTable } from '@/frontend/components/ui/data-table';
import { usePaginatedApi, apiPost } from '@/frontend/hooks/use-api';
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
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Role {
  role_id: number;
  role_code: string;
  role_name: string;
  is_active: number;
  created_at: string;
}

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: roles, total, totalPages, isLoading, mutate: refreshRoles } = usePaginatedApi<Role>(
    '/api/roles',
    page,
    10,
    search
  );

  const [formData, setFormData] = useState({
    roleCode: '',
    roleName: '',
    isActive: true,
  });

  const columns = [
    { key: 'role_code', title: 'Code' },
    { key: 'role_name', title: 'Name' },
    {
      key: 'is_active',
      title: 'Status',
      render: (role: Role) => (
        <Badge variant={role.is_active ? 'default' : 'secondary'}>
          {role.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (role: Role) => format(new Date(role.created_at), 'dd/MM/yyyy HH:mm'),
    },
  ];

  const handleOpenDialog = () => {
    setFormData({
      roleCode: '',
      roleName: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await apiPost('/api/roles', formData);

      if (result.success) {
        toast.success(result.message || 'Role berhasil ditambahkan');
        setIsDialogOpen(false);
        refreshRoles();
      } else {
        toast.error(result.error || 'Gagal menambahkan role');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = currentUser && currentUser.roleId === 1;

  return (
    <div className="flex flex-col">
      <Header title="Roles" description="Manage user roles" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Role List</h2>
          {canEdit && (
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={roles}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search roles..."
        />
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>Create a new user role</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleCode">Role Code</Label>
                <Input
                  id="roleCode"
                  value={formData.roleCode}
                  onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                  required
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
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
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
