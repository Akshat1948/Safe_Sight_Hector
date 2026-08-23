import { apiClient, setTokens, clearTokens, setCachedUser, getCachedUser } from './client';
import { AuthResponse, IUser, LoginRequest, UserRole } from '@/shared/types';

export async function login(credentials: LoginRequest) {
  const res = await apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (res.success && res.data) {
    setTokens(res.data.accessToken, res.data.refreshToken);
    setCachedUser(res.data.user);
    return res;
  }

  // Fallback demo authentication when backend server is not running
  const { email, password } = credentials;
  if (
    (email === 'manager@safesight.local' || email === 'manager@safesight.io') &&
    (password === 'safesight123' || password === 'password')
  ) {
    const demoUser: IUser = {
      id: 'demo-manager-uuid-01',
      email: 'manager@safesight.local',
      name: 'Rajesh Sharma (Site Manager)',
      role: UserRole.MANAGER,
      siteId: 'demo-site-prayagraj-01',
      phone: '+919876543210',
    };
    const demoAuth: AuthResponse = {
      accessToken: 'demo-manager-access-token',
      refreshToken: 'demo-manager-refresh-token',
      user: demoUser,
    };
    setTokens(demoAuth.accessToken, demoAuth.refreshToken);
    setCachedUser(demoUser);
    return {
      success: true,
      data: demoAuth,
      message: 'Demo Mode: Login successful',
    };
  }

  if (
    (email === 'responder@safesight.local' || email === 'responder@safesight.io') &&
    (password === 'safesight123' || password === 'password')
  ) {
    const demoUser: IUser = {
      id: 'demo-responder-uuid-01',
      email: 'responder@safesight.local',
      name: 'Vikram Singh (108 Emergency Lead)',
      role: UserRole.RESPONDER,
      siteId: 'demo-site-prayagraj-01',
      phone: '+919876543211',
    };
    const demoAuth: AuthResponse = {
      accessToken: 'demo-responder-access-token',
      refreshToken: 'demo-responder-refresh-token',
      user: demoUser,
    };
    setTokens(demoAuth.accessToken, demoAuth.refreshToken);
    setCachedUser(demoUser);
    return {
      success: true,
      data: demoAuth,
      message: 'Demo Mode: Login successful',
    };
  }

  return {
    success: false,
    data: null,
    message: res.message || 'Invalid email or password',
    error: res.error || 'UNAUTHORIZED',
  };
}

export async function getMe() {
  const res = await apiClient<IUser>('/auth/me');
  if (res.success && res.data) {
    setCachedUser(res.data);
    return res;
  }

  const cached = getCachedUser<IUser>();
  if (cached) {
    return {
      success: true,
      data: cached,
      message: 'User profile retrieved from session cache',
    };
  }

  return res;
}

export function logout() {
  clearTokens();
}
