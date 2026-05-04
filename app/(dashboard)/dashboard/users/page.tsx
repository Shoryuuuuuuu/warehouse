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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';

interface User {
  user_id: number;
  user_name: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_active: number;
  is_login: number;
  created_at: string;
}

interface Role {
  role_id: number;
  role_code: string;
  role_name: string;
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const { data: users, total, totalPages, isLoading, mutate: refreshUsers } = usePaginatedApi<User>(
    '/api/users',
    page,
    10,
    search
  );

  const { data: roles } = useApi<Role[]>('/api/roles?all=true');

  const [formData, setFormData] = useState({
    userName: '',
    fullName: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  const columns = [
    { key: 'user_name', title: 'Username' },
    { key: 'full_name', title: 'Full Name' },
    { key: 'role_name', title: 'Role' },
    {
      key: 'is_active',
      title: 'Status',
      render: (user: User) => (
        <Badge variant={user.is_active ? 'default' : 'secondary'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'is_login',
      title: 'Login Status',
      render: (user: User) => (
        <Badge variant={user.is_login ? 'default' : 'outline'}>
          {user.is_login ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
  ];

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        userName: user.user_name,
        fullName: user.full_name,
        password: '',
        roleId: String(user.role_id),
        isActive: user.is_active === 1,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        userName: '',
        fullName: '',
        password: '',
        roleId: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        userName: formData.userName,
        fullName: formData.fullName,
        password: formData.password || undefined,
        roleId: parseInt(formData.roleId),
        isActive: formData.isActive,
      };

      const result = selectedUser
        ? await apiPut(`/api/users/${selectedUser.user_id}`, payload)
        : await apiPost('/api/users', payload);

      if (result.success) {
        toast.success(result.message || 'User berhasil disimpan');
        setIsDialogOpen(false);
        refreshUsers();
        mutate('/api/users');
      } else {
        toast.error(result.error || 'Gagal menyimpan user');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const result = await apiDelete(`/api/users/${selectedUser.user_id}`);
      if (result.success) {
        toast.success('User berhasil dihapus');
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        refreshUsers();
      } else {
        toast.error(result.error || 'Gagal menghapus user');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const canEdit = currentUser && currentUser.roleId <= 2;
  const canDelete = currentUser && currentUser.roleId === 1;

  return (
    <div className="flex flex-col">
      <Header title="User Management" description="Manage system users and their access" />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Users</h2>
          {canEdit && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search users..."
          actions={
            canEdit
              ? (user: User) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete && user.user_id !== currentUser?.userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {selectedUser && '(leave blank to keep current)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!selectedUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select
                  value={formData.roleId}
                  onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.role_id} value={String(role.role_id)}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {selectedUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete user "${selectedUser?.full_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
