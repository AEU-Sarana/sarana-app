import { apiClient } from './apiClient';
import { DashboardOverviewResponse, TopSellingProduct } from '../features/dashboard/types';

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

  async getTopProducts(limit: number = 5, sortBy: 'quantity' | 'revenue' = 'quantity'): Promise<TopSellingProduct[]> {
    const response = await apiClient.get<ApiResponse<TopSellingProduct[]>>('/dashboard/top-products', {
      params: { limit, sortBy },
    });
    return response.data;
  },
};
