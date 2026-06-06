import { apiClient } from './apiClient';
import { AppSetting, UpdateSettingsRequest } from '../features/setting/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const settingService = {
  /**
   * Fetch current application settings (includes receipt/invoice info)
   */
  async getSettings(): Promise<AppSetting> {
    const response = await apiClient.get<ApiResponse<AppSetting>>('/settings');
    return response.data;
  },

  /**
   * Update application settings + invoice info via unified PUT /settings
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<AppSetting> {
    const response = await apiClient.put<ApiResponse<AppSetting>>('/settings', data);
    return response.data;
  },

  /**
   * Upload store logo – still uses the dedicated receipt-settings logo endpoint
   */
  async uploadLogo(file: File): Promise<{ logo_path: string; updated_at: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.post<ApiResponse<{ logo_path: string; updated_at: string }>>(
      '/admin/receipt-settings/logo',
      formData
    );
    return response.data;
  },
};
