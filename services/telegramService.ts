import { apiClient } from './apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TelegramConfigResponse {
  config_id: number;
  bot_token?: string;
  has_token?: boolean;
  group_chat_id: string;
  is_active: boolean;
  last_test_time: string | null;
  last_test_status: 'SUCCESS' | 'FAILED' | null;
}

export interface TestConnectionResponse {
  connected: boolean;
  bot_name?: string;
  error?: string;
}

export const telegramService = {
  async getTelegramConfig(): Promise<TelegramConfigResponse | null> {
    const response = await apiClient.get<ApiResponse<TelegramConfigResponse | null>>('/telegram/config');
    return response.data;
  },

  async updateTelegramConfig(data: {
    bot_token: string;
    group_chat_id: string;
    is_active?: boolean;
  }): Promise<TelegramConfigResponse> {
    const response = await apiClient.post<ApiResponse<TelegramConfigResponse>>('/telegram/config', data);
    return response.data;
  },

  async testConnection(data?: {
    bot_token?: string;
    group_chat_id?: string;
  }): Promise<TestConnectionResponse> {
    const response = await apiClient.post<ApiResponse<TestConnectionResponse>>('/telegram/test', data || {});
    return response.data;
  },

  async sendTestMessage(message: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/telegram/send-test-message', {
      message,
    });
    return response.data as any;
  },

  async sendDailyReport(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/telegram/send-report');
    return response.data;
  },
};
