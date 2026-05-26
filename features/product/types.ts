export type ProductStatus = 'active' | 'inactive';

export interface Product {
  product_id: number;
  product_code: string;
  product_name: string;
  barcode: string;
  price: number;
  category: string | null;
  category_id?: number | null;
  description: string | null;
  image_path: string | null;
  low_stock_threshold: number | null;
  has_expiry?: boolean;
  stock_quantity: number;
  expired_at?: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ListProductsRequest {
  page?: number;
  limit?: number;
  status?: ProductStatus | string;
  category_id?: number | string;
  search?: string;
  barcode?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
}

export interface CreateProductRequest {
  product_name: string;
  barcode: string;
  price: number;
  category_id?: number | null;
  description?: string | null;
  low_stock_threshold?: number | null;
  has_expiry?: boolean;
  stock_qty?: number;
  expired_at?: string | null;
  status: ProductStatus;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}
