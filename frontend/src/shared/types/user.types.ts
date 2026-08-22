export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  siteId: string | null;
  phone: string | null;
}

export enum UserRole {
  MANAGER = 'manager',
  RESPONDER = 'responder',
  ADMIN = 'admin',
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
