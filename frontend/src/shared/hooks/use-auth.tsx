'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { IUser } from '@/shared/types';
import { login as apiLogin, getMe, logout as apiLogout } from '@/shared/api/auth.api';
import { getAccessToken } from '@/shared/api/client';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: IUser; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    if (res.success && res.data) {
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, error: res.message || 'Login failed' };
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
