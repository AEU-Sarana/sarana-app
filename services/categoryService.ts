import { apiClient } from './apiClient';
import { Category, CategoryCount } from '../features/category/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Normalizes category data from the API to handle both snake_case and camelCase keys.
 */
function mapCategory(data: any): Category {
  if (!data) return data;
  return {
    categoryId: data.categoryId ?? data.category_id,
    name: data.name,
    description: data.description,
    isActive: data.isActive ?? data.is_active ?? true,
    createdAt: data.createdAt ?? data.created_at,
    updatedAt: data.updatedAt ?? data.updated_at,
  };
}

export const categoryService = {
  async listCategories(includeInactive = false): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/categories', {
      params: includeInactive ? { include_inactive: true } : undefined,
    });
    return (response.data || []).map(mapCategory);
  },

  /**
   * Get categories with product count (for dashboard filters)
   */
  async listCategoryCounts(): Promise<CategoryCount[]> {
    const response = await apiClient.get<ApiResponse<{ categories: CategoryCount[] }>>('/products/categories');
    return response.data.categories;
  },

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await apiClient.post<ApiResponse<any>>('/categories', data);
    return mapCategory(response.data);
  },

  /**
   * Update an existing category
   */
  async updateCategory(categoryId: number, data: { name: string; description?: string }): Promise<Category> {
    const response = await apiClient.put<ApiResponse<any>>(`/categories/${categoryId}`, data);
    return mapCategory(response.data);
  },

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number): Promise<void> {
    await apiClient.delete<ApiResponse<any>>(`/categories/${categoryId}`);
  },

  /**
   * Toggle category status (active <-> inactive)
   */
  async toggleCategoryStatus(categoryId: number): Promise<Category> {
    const response = await apiClient.patch<ApiResponse<any>>(`/categories/${categoryId}/toggle-status`);
    return mapCategory(response.data);
  },
};

