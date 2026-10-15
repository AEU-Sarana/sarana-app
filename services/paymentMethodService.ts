import { apiClient } from './apiClient';

export interface PaymentMethod {
  paymentMethodId: number;
  name: string;
  code: string;
  type: 'CASH' | 'BANK_TRANSFER' | 'QR' | 'CARD' | 'OTHER';
  accountName?: string | null;
  accountNumber?: string | null;
  qrCodeUrl?: string | null;
  note?: string | null;
  isActive: boolean;
  isSystem: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentMethodPayload {
  name: string;
  code?: string;
  type?: string;
  accountName?: string;
  accountNumber?: string;
  qrCodeUrl?: string;
  note?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdatePaymentMethodPayload {
  name?: string;
  code?: string;
  type?: string;
  accountName?: string;
  accountNumber?: string;
  qrCodeUrl?: string;
  note?: string;
  isActive?: boolean;
  displayOrder?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function mapPaymentMethod(data: any): PaymentMethod {
  if (!data) return data;
  return {
    paymentMethodId: data.paymentMethodId ?? data.payment_method_id,
    name: data.name,
    code: data.code,
    type: data.type ?? 'BANK_TRANSFER',
    accountName: data.accountName ?? data.account_name ?? null,
    accountNumber: data.accountNumber ?? data.account_number ?? null,
    qrCodeUrl: data.qrCodeUrl ?? data.qr_code_url ?? null,
    note: data.note ?? null,
    isActive: data.isActive ?? data.is_active ?? true,
    isSystem: data.isSystem ?? data.is_system ?? false,
    displayOrder: data.displayOrder ?? data.display_order ?? 0,
    createdAt: data.createdAt ?? data.created_at,
    updatedAt: data.updatedAt ?? data.updated_at,
  };
}

export const paymentMethodService = {
  async getPaymentMethods(includeInactive = false): Promise<PaymentMethod[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/payment-methods', {
      params: includeInactive ? { include_inactive: true } : undefined,
    });
    return (response.data || []).map(mapPaymentMethod);
  },

  async getPaymentMethod(id: number): Promise<PaymentMethod> {
    const response = await apiClient.get<ApiResponse<any>>(`/payment-methods/${id}`);
    return mapPaymentMethod(response.data);
  },

  async createPaymentMethod(payload: CreatePaymentMethodPayload): Promise<PaymentMethod> {
    const response = await apiClient.post<ApiResponse<any>>('/payment-methods', payload);
    return mapPaymentMethod(response.data);
  },

  async updatePaymentMethod(id: number, payload: UpdatePaymentMethodPayload): Promise<PaymentMethod> {
    const response = await apiClient.put<ApiResponse<any>>(`/payment-methods/${id}`, payload);
    return mapPaymentMethod(response.data);
  },

  async togglePaymentMethod(id: number): Promise<PaymentMethod> {
    const response = await apiClient.patch<ApiResponse<any>>(`/payment-methods/${id}/toggle`);
    return mapPaymentMethod(response.data);
  },

  async deletePaymentMethod(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<any>>(`/payment-methods/${id}`);
  },
};
