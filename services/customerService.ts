import { apiClient } from './apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CustomerPurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  totalSpent: number;
}

export interface CustomerWithPurchases {
  customerId: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastBuyAt: string | null;
  purchases: CustomerPurchaseItem[];
  totalPaid: number;
  totalDebt?: number;
  ordersCount?: number;
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

export interface OpenCustomerOrder {
  orderId: number;
  receiptNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  dueDate: string | null;
  orderDate: string;
}

export interface CustomerDebtItem {
  customerId: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  totalDebt: number;
  openOrderCount: number;
  oldestDueDate: string | null;
  isOverdue: boolean;
  openOrders: OpenCustomerOrder[];
}

export interface CustomerDebtOverview {
  metrics: {
    totalDebt: number;
    overdueDebt: number;
    collectedThisMonth: number;
  };
  customerDebts: CustomerDebtItem[];
}

export interface RecordCustomerPaymentRequest {
  customer_id: number;
  order_id?: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  attachment_url?: string;
  notes?: string;
  payment_date?: string;
}

export interface CustomerPaymentItem {
  paymentId: number;
  paymentNumber: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string | null;
  orderId?: number | null;
  receiptNumber?: string | null;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  attachmentUrl?: string | null;
  paymentDate: string;
  notes?: string | null;
  createdBy: number;
  createdByName?: string;
}

export interface CreateCustomerPayload {
  full_name: string;
  phone?: string;
  email?: string;
}

export interface UpdateCustomerPayload {
  full_name?: string;
  phone?: string;
  email?: string;
}

export interface CustomerDetails {
  customerId: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  deviceId: string | null;
  totalDebt: number;
  createdAt: string;
  lastBuyAt: string | null;
  totalPaid: number;
  ordersCount: number;
  orders: any[];
  customerPayments: any[];
}

export const customerService = {
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ListCustomersResponse> {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();

    const response = await apiClient.get<ApiResponse<any>>('/customers', { params: cleanParams });
    const { customers, pagination } = response.data;
    
    return {
      customers: (customers || []).map((c: any) => ({
        customerId: c.customerId,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        createdAt: c.createdAt,
        lastBuyAt: c.lastBuyAt,
        totalPaid: c.totalPaid || 0,
        totalDebt: c.totalDebt || 0,
        ordersCount: c.ordersCount || 0,
        purchases: (c.purchases || []).map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          quantity: p.quantity,
          totalSpent: p.totalSpent,
        })),
      })),
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        total: pagination?.total || 0,
        totalPages: pagination?.totalPages || 1,
      },
    };
  },

  async createCustomer(payload: CreateCustomerPayload): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/customers', payload);
    return response.data;
  },

  async updateCustomer(customerId: number, payload: UpdateCustomerPayload): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/customers/${customerId}`, payload);
    return response.data;
  },

  async getCustomerDetails(customerId: number): Promise<CustomerDetails> {
    const response = await apiClient.get<ApiResponse<CustomerDetails>>(`/customers/${customerId}`);
    return response.data;
  },

  async getCustomerDebtOverview(): Promise<CustomerDebtOverview> {
    const response = await apiClient.get<ApiResponse<CustomerDebtOverview>>('/customers/debts');
    return response.data;
  },

  async recordPayment(payload: RecordCustomerPaymentRequest): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/customers/payments', payload);
    return response;
  },

  async getPaymentHistory(customerId?: number, page = 1, limit = 50): Promise<{ payments: CustomerPaymentItem[]; pagination: any }> {
    const params: Record<string, any> = { page, limit };
    if (customerId) params.customer_id = customerId;
    const response = await apiClient.get<ApiResponse<{ payments: CustomerPaymentItem[]; pagination: any }>>('/customers/payments', { params });
    return response.data;
  },
};
