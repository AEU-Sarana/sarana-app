export type UserRole = 'ADMIN' | 'CASHIER';
export type UserStatus = 'active' | 'inactive';

export interface User {
  userId: number;
  username: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  phone: string | null;
  status: UserStatus;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
  deactivatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListUsersResponse {
  users: User[];
  pagination: UserPagination;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  full_name: string;
  password?: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
}
