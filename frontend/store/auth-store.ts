import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  userId: number;
  userName: string;
  fullName: string;
  roleId: number;
  roleName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      checkAuth: () => {
        const state = get();
        if (state.user) {
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
