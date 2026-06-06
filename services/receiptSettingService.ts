import { apiClient } from './apiClient';
import { ReceiptSetting, UpdateReceiptSettingRequest } from '../features/receipt/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const receiptSettingService = {
  /**
   * Fetch current receipt / invoice settings
   */
  async getSettings(): Promise<ReceiptSetting> {
    const response = await apiClient.get<ApiResponse<ReceiptSetting>>('/admin/receipt-settings');
    return response.data;
  },

  /**
   * Update receipt / invoice settings (text fields)
   */
  async updateSettings(data: UpdateReceiptSettingRequest): Promise<ReceiptSetting> {
    const response = await apiClient.put<ApiResponse<ReceiptSetting>>('/admin/receipt-settings', data);
    return response.data;
  },

  /**
   * Upload store logo – sends multipart/form-data
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
