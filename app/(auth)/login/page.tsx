'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/frontend/store/auth-store';
import { apiPost } from '@/frontend/hooks/use-api';
import { Loader2, Warehouse } from 'lucide-react';

export default function LoginPage() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await apiPost<{
        userId: number;
        userName: string;
        fullName: string;
        roleId: number;
        roleName: string;
      }>('/api/auth/login', { userName, password });

      if (result.success && result.data) {
        setUser(result.data);
        toast.success('Login berhasil');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Login gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Warehouse className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">WMS Login</CardTitle>
          <CardDescription>
            Masukkan kredensial untuk mengakses sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Masukkan username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
          {/* <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-muted-foreground">
              <p><span className="font-mono">admin</span> / <span className="font-mono">admin123</span> (Super Admin)</p>
              <p><span className="font-mono">manager</span> / <span className="font-mono">manager123</span> (Manager)</p>
              <p><span className="font-mono">staff</span> / <span className="font-mono">staff123</span> (Staff)</p>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
