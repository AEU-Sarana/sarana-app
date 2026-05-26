import { apiClient } from './apiClient';
import {
  Product,
  ListProductsRequest,
  ListProductsResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '../features/product/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const productService = {
  /**
   * Get paginated products list with optional filters
   */
  async listProducts(params?: ListProductsRequest): Promise<ListProductsResponse> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
      if (params.status) cleanParams.status = params.status;
      if (params.category_id) cleanParams.category_id = params.category_id;
      if (params.search) cleanParams.search = params.search;
      if (params.barcode) cleanParams.barcode = params.barcode;
    }

    const response = await apiClient.get<ApiResponse<ListProductsResponse>>('/products', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Fetch single product details by ID
   */
  async getProduct(productId: number): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${productId}`);
    return response.data;
  },

  /**
   * Create a new product. Accepts FormData for image upload.
   */
  async createProduct(data: FormData | CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    return response.data;
  },

  /**
   * Update an existing product. Accepts FormData for image upload.
   */
  async updateProduct(productId: number, data: FormData | UpdateProductRequest): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${productId}`, data);
    return response.data;
  },

  /**
   * Soft-delete a product
   */
  async deleteProduct(productId: number): Promise<void> {
    await apiClient.delete<ApiResponse<any>>(`/products/${productId}`);
  },

  /**
   * Toggle active/inactive status of a product
   */
  async toggleProductStatus(productId: number): Promise<{ product_id: number; status: 'active' | 'inactive' }> {
    const response = await apiClient.patch<ApiResponse<{ product_id: number; status: 'active' | 'inactive' }>>(
      `/products/${productId}/toggle-status`
    );
    return response.data;
  },
};
