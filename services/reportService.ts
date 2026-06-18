import { apiClient } from './apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity_sold: number;
  revenue: number;
  average_price: number;
}

export interface ShiftBreakdown {
  seller_id: number;
  seller_name: string;
  shift_count: number;
  total_sales: number;
  total_orders: number;
  start_time: string | null;
  end_time: string | null;
}

export interface LowStockItem {
  product_id: number;
  product_name: string;
  product_code: string;
  current_stock: number;
  low_stock_threshold: number;
  status: 'low_stock' | 'out_of_stock';
  last_updated: string;
}

export interface DailyReportSummary {
  total_products_sold: number;
  unique_products_sold: number;
  average_items_per_order: number;
  exchange_rate: number;
  cash_collected: number;
  short_over_amount: number;
}

export interface DailySalesReportResponse {
  date: string;
  total_sales: number;
  total_orders: number;
  total_shifts: number;
  average_order_value: number;
  shifts_breakdown: ShiftBreakdown[];
  top_products: TopProduct[];
  low_stock_items: LowStockItem[];
  summary: DailyReportSummary;
}

export interface SalesReportItem {
  date: string;
  total_sales: number;
  total_orders: number;
  total_shifts: number;
}

export interface SalesHistoryReportResponse {
  sales: SalesReportItem[];
  pagination: ReportPagination;
  summary: {
    total_sales: number;
    total_orders: number;
    average_daily_sales: number;
  };
}

export interface StockReportItem {
  product_id: number;
  product_name: string;
  product_code?: string;
  category?: string | null;
  current_stock: number;
  low_stock_threshold: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'negative';
}

export interface StockReportResponse {
  summary: {
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
    negative_stock_count: number;
  };
  stock_report: StockReportItem[];
}

export interface IncomeReportResponse {
  total_sales: number;
  total_orders: number;
  totalItems: number;
  cogs: number;
  profit: number;
  purchasesCost: number;
  purchasesQty: number;
}

export interface ExportReportResponse {
  file_url: string;
  file_name: string;
}

export const reportService = {
  async getDailyReport(date?: string, sellerId?: number): Promise<DailySalesReportResponse> {
    const params: Record<string, string | number> = {};
    if (date) params.date = date;
    if (sellerId) params.seller_id = sellerId;
    const response = await apiClient.get<ApiResponse<DailySalesReportResponse>>('/reports/daily', { params });
    return response.data;
  },

  async getSalesHistoryReport(params?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date?: string;
    end_date?: string;
    seller_id?: number;
    product_id?: number;
    page?: number;
    limit?: number;
  }): Promise<SalesHistoryReportResponse> {
    const response = await apiClient.get<ApiResponse<SalesHistoryReportResponse>>('/reports/sales', { params });
    return response.data;
  },

  async getStockReport(params?: {
    low_stock_only?: boolean;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date?: string;
    end_date?: string;
  }): Promise<StockReportResponse> {
    const response = await apiClient.get<ApiResponse<StockReportResponse>>('/reports/stock', { params });
    return response.data;
  },

  async getIncomeReport(period?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<IncomeReportResponse> {
    const response = await apiClient.get<ApiResponse<IncomeReportResponse>>('/reports/income', {
      params: period ? { period } : undefined,
    });
    return response.data;
  },

  async exportReport(data: {
    report_type: 'daily_sales' | 'sales_history' | 'stock_summary';
    format: 'CSV' | 'XLSX' | 'PDF';
    date?: string;
    start_date?: string;
    end_date?: string;
    seller_id?: number;
    product_id?: number;
    low_stock_only?: boolean;
  }): Promise<ExportReportResponse> {
    const response = await apiClient.post<ApiResponse<ExportReportResponse>>('/reports/export', data);
    return response.data;
  },
};
