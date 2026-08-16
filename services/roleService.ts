import { apiClient } from './apiClient';

export interface RolePermissionInput {
  feature_key: string;
  actions: string[];
}

export interface Role {
  role_id: number;
  key: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  user_count?: number;
  permissions: RolePermissionInput[];
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  key: string;
  name: string;
  description?: string;
  permissions?: RolePermissionInput[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: RolePermissionInput[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const roleService = {
  async listRoles(): Promise<Role[]> {
    const response = await apiClient.get<ApiResponse<Role[]>>('/roles');
    return response.data;
  },

  async getRole(roleId: number): Promise<Role> {
    const response = await apiClient.get<ApiResponse<Role>>(`/roles/${roleId}`);
    return response.data;
  },

  async createRole(payload: CreateRolePayload): Promise<Role> {
    const response = await apiClient.post<ApiResponse<Role>>('/roles', payload);
    return response.data;
  },

  async updateRole(roleId: number, payload: UpdateRolePayload): Promise<Role> {
    const response = await apiClient.put<ApiResponse<Role>>(`/roles/${roleId}`, payload);
    return response.data;
  },

  async deleteRole(roleId: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/roles/${roleId}`);
  },
};
