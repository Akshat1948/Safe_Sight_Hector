'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { IUser, UserRole } from '@/shared/types';
import { login as apiLogin, getMe, logout as apiLogout } from '@/shared/api/auth.api';
import { getAccessToken, getCachedUser, clearTokens } from '@/shared/api/client';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: IUser; error?: string }>;
  logout: () => void;
}

const DEFAULT_DEMO_USER: IUser = {
  id: 'demo-commander-01',
  email: 'manager@safesight.local',
  name: 'Site Commander',
  role: UserRole.MANAGER,
  siteId: 'demo-site-prayagraj-01',
  phone: '+919876543210',
};

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
          } else {
            const cached = getCachedUser<IUser>();
            setUser(cached || DEFAULT_DEMO_USER);
          }
        })
        .catch(() => {
          const cached = getCachedUser<IUser>();
          setUser(cached || DEFAULT_DEMO_USER);
        })
        .finally(() => setLoading(false));
    } else {
      const cached = getCachedUser<IUser>();
      setUser(cached || DEFAULT_DEMO_USER);
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
    clearTokens();
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

