import { apiClient } from './apiClient';
import { User, ListUsersResponse, CreateUserRequest, UpdateUserRequest } from '../features/user/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function mapUser(data: any): User {
  if (!data) return data;
  return {
    userId: data.userId ?? data.user_id,
    username: data.username,
    email: data.email,
    fullName: data.fullName ?? data.full_name,
    role: data.role,
    phone: data.phone,
    status: data.status,
    deviceId: data.deviceId ?? data.device_id,
    createdAt: data.createdAt ?? data.created_at,
    updatedAt: data.updatedAt ?? data.updated_at,
    deactivatedDate: data.deactivatedDate ?? data.deactivated_date,
    createdBy: data.createdBy ?? data.created_by,
    updatedBy: data.updatedBy ?? data.updated_by,
  };
}

export const userService = {
  async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ListUsersResponse> {
    const response = await apiClient.get<ApiResponse<any>>('/users', { params });
    const { users, pagination } = response.data;
    return {
      users: (users || []).map(mapUser),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },

  async getUser(userId: number): Promise<User> {
    const response = await apiClient.get<ApiResponse<any>>(`/users/${userId}`);
    return mapUser(response.data);
  },

  async createUser(payload: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<ApiResponse<any>>('/users', payload);
    return mapUser(response.data);
  },

  async updateUser(userId: number, payload: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<any>>(`/users/${userId}`, payload);
    return mapUser(response.data);
  },

  async deactivateUser(userId: number): Promise<{ user_id: number; status: string; deactivated_date?: string }> {
    const response = await apiClient.delete<ApiResponse<any>>(`/users/${userId}`);
    return response.data;
  },

  async setUserPin(userId: number, pin: string): Promise<{ user_id: number; pin_configured: boolean }> {
    const response = await apiClient.put<ApiResponse<any>>(`/users/${userId}/pin`, { pin });
    return response.data;
  },
};
