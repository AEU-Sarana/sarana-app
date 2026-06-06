import { apiClient } from './apiClient';
import {
  GetStockRequest,
  GetStockListResponse,
  StockInRequest,
  StockInResponse,
  GetStockMovementsRequest,
  GetStockMovementsResponse,
  StockAdjustRequest,
  StockAdjustResponse,
} from '../features/stock/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const stockService = {
  /**
   * Get paginated stock list with optional filters
   */
  async getStockList(params?: GetStockRequest): Promise<GetStockListResponse> {
    const clean: Record<string, string | number> = {};
    if (params) {
      if (params.page !== undefined) clean.page = params.page;
      if (params.limit !== undefined) clean.limit = params.limit;
      if (params.status) clean.status = params.status;
      if (params.search) clean.search = params.search;
      if (params.barcode) clean.barcode = params.barcode;
      if (params.category_id) clean.category_id = params.category_id;
      if (params.product_status) clean.product_status = params.product_status;
    }
    const response = await apiClient.get<ApiResponse<GetStockListResponse>>('/stocks', {
      params: clean,
    });
    return response.data;
  },

  /**
   * POST /stock/in — add stock for a product
   */
  async stockIn(data: StockInRequest): Promise<StockInResponse> {
    const response = await apiClient.post<ApiResponse<StockInResponse>>('/stocks/in', data);
    return response.data;
  },

  /**
   * GET /stock/movements — paginated movement history
   */
  async getMovements(params?: GetStockMovementsRequest): Promise<GetStockMovementsResponse> {
    const clean: Record<string, string | number> = {};
    if (params) {
      if (params.page !== undefined) clean.page = params.page;
      if (params.limit !== undefined) clean.limit = params.limit;
      if (params.product_id !== undefined) clean.product_id = params.product_id;
      if (params.movement_type) clean.movement_type = params.movement_type;
      if (params.date_from) clean.date_from = params.date_from;
      if (params.date_to) clean.date_to = params.date_to;
      if (params.product_name) clean.product_name = params.product_name;
      if (params.barcode) clean.barcode = params.barcode;
    }
    const response = await apiClient.get<ApiResponse<GetStockMovementsResponse>>('/stocks/movements', {
      params: clean,
    });
    return response.data;
  },

  /**
   * POST /stocks/adjust — manually adjust stock levels
   */
  async stockAdjust(data: StockAdjustRequest): Promise<StockAdjustResponse> {
    const response = await apiClient.post<ApiResponse<StockAdjustResponse>>('/stocks/adjust', data);
    return response.data;
  },
};
