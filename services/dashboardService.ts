import { apiClient } from './apiClient';
import { DashboardOverviewResponse } from '../features/dashboard/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverviewResponse> {
    const response = await apiClient.get<ApiResponse<DashboardOverviewResponse>>('/dashboard/overview');
    return response.data;
  },
};
