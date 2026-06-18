import { apiClient } from './apiClient';
import { ListOrdersRequest, ListOrdersResponse, Order } from '../features/sale/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const saleService = {
  async listOrders(params?: ListOrdersRequest): Promise<ListOrdersResponse> {
    const response = await apiClient.get<ApiResponse<any>>('/orders', { params: params as any });
    const { orders, pagination } = response.data;
    return {
      orders: orders || [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },

  async getOrder(orderId: number): Promise<Order> {
    const response = await apiClient.get<ApiResponse<any>>(`/orders/${orderId}`);
    return response.data;
  },

  async createOrder(data: {
    payment_method: 'CASH' | 'BANK';
    received_amount?: number;
    discount_amount?: number;
    tax_amount?: number;
    service_fee?: number;
    items: {
      product_id: number;
      quantity: number;
      unit_price: number;
      discount_amount?: number;
      subtotal: number;
    }[];
  }): Promise<Order> {
    const response = await apiClient.post<ApiResponse<any>>('/orders', data);
    return response.data;
  },
};
