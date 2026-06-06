import { apiClient } from './apiClient';
import { CustomerWithPurchases } from '../app/admin/dashboard/page';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ListCustomersResponse {
  customers: CustomerWithPurchases[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const customerService = {
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    telegramFilter?: 'all' | 'linked' | 'unlinked';
  }): Promise<ListCustomersResponse> {
    const response = await apiClient.get<ApiResponse<any>>('/customers', { params });
    const { customers, pagination } = response.data;
    
    return {
      customers: (customers || []).map((c: any) => ({
        customerId: c.customerId,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        telegramLinked: c.telegramLinked,
        createdAt: c.createdAt,
        lastBuyAt: c.lastBuyAt,
        totalPaid: c.totalPaid || 0,
        purchases: (c.purchases || []).map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          quantity: p.quantity,
          totalSpent: p.totalSpent,
        })),
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },
};
