export enum UserRole {
  MANAGER = 'manager',
  RESPONDER = 'responder',
  ADMIN = 'admin',
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  siteId: string | null;
  phone: string | null;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
