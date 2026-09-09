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
    payment_method: string;
    customer_id?: number;
    payment_type?: 'PAID' | 'DEBT' | 'PARTIAL';
    initial_paid_amount?: number;
    payment_due_date?: string;
    received_amount?: number;
    reference_number?: string;
    transaction_id?: string;
    received_usd?: number;
    received_khr?: number;
    change_usd?: number;
    change_khr?: number;
    slip_url?: string;
    notes?: string;
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

  async requestCancellation(orderId: number, reason: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<any>>(`/orders/${orderId}/request-cancel`, { reason });
    return response.data;
  },

  async approveCancellation(orderId: number): Promise<Order> {
    const response = await apiClient.post<ApiResponse<any>>(`/orders/${orderId}/approve-cancel`, {});
    return response.data;
  },

  async rejectCancellation(orderId: number, reason?: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<any>>(`/orders/${orderId}/reject-cancel`, { reason });
    return response.data;
  },

  async listCancellationRequests(): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<any>>('/orders/cancellation-requests');
    return response.data;
  },
};

