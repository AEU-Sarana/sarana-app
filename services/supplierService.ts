import { apiClient } from './apiClient';

export interface OpenPO {
  poId: number;
  poNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  dueDate: string | null;
  orderDate: string;
}

export interface SupplierDebtItem {
  supplierId: number;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  paymentTerms: string | null;
  totalDebt: number;
  openPOCount: number;
  oldestDueDate: string | null;
  isOverdue: boolean;
  openPOs: OpenPO[];
}

export interface SupplierDebtOverview {
  metrics: {
    totalDebt: number;
    overdueDebt: number;
    paidThisMonth: number;
  };
  supplierDebts: SupplierDebtItem[];
}

export interface RecordSupplierPaymentRequest {
  supplier_id: number;
  po_id?: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  payment_date?: string;
}

export interface SupplierPaymentItem {
  paymentId: number;
  paymentNumber: string;
  supplierId: number;
  supplierName?: string;
  poId?: number | null;
  poNumber?: string | null;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  paymentDate: string;
  notes?: string | null;
  createdBy: number;
  createdByName?: string;
}

export const supplierService = {
  /**
   * Get supplier debt overview & metrics
   */
  async getSupplierDebtOverview(): Promise<SupplierDebtOverview> {
    const response = await apiClient.get<{ success: boolean; data: SupplierDebtOverview }>('/suppliers/debts');
    return response.data;
  },

  /**
   * Record payment to supplier
   */
  async recordPayment(payload: RecordSupplierPaymentRequest): Promise<any> {
    const response = await apiClient.post<{ success: boolean; message: string; data: any }>('/suppliers/payments', payload);
    return response;
  },

  /**
   * Get supplier payment history
   */
  async getPaymentHistory(supplierId?: number, page = 1, limit = 50): Promise<{ payments: SupplierPaymentItem[]; pagination: any }> {
    const params: Record<string, any> = { page, limit };
    if (supplierId) params.supplier_id = supplierId;
    const response = await apiClient.get<{ success: boolean; data: { payments: SupplierPaymentItem[]; pagination: any } }>('/suppliers/payments', { params });
    return response.data;
  },
};
