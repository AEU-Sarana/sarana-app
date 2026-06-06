export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'negative';
export type StockMovementType = 'STOCK_IN' | 'ADJUSTMENT' | 'SALE' | 'RETURN' | 'EXPIRED';

// ─── List stock ───────────────────────────────────────────────
export interface StockListItem {
  stock_id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  image_path: string | null;
  barcode: string | null;
  category: string | null;
  price: number;
  quantity: number;
  low_stock_threshold: number | null;
  stock_version: number;
  status: StockStatus;
  product_status: 'active' | 'inactive';
  has_expiry: boolean;
  expired_at: string | null;
  updated_at: string;
}

export interface StockSummary {
  total_products: number;
  total_stock_quantity: number;
  low_stock_count: number;
  out_of_stock_count: number;
  negative_stock_count: number;
}

export interface GetStockListResponse {
  stocks: StockListItem[];
  summary: StockSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetStockRequest {
  product_id?: number;
  status?: StockStatus;
  category_id?: number;
  search?: string;
  barcode?: string;
  page?: number;
  limit?: number;
  product_status?: 'active' | 'inactive';
}

// ─── Stock In ─────────────────────────────────────────────────
export interface StockInRequest {
  product_id: number;
  quantity: number;
  cost?: number;
  supplier?: string;
  received_at?: string; // ISO 8601
  expired_at?: string;  // ISO 8601
}

export interface StockInResponse {
  movement_id: number;
  product_id: number;
  movement_type: StockMovementType;
  quantity: number;
  cost?: number | null;
  supplier?: string | null;
  stock: {
    stock_id: number;
    quantity: number;
    stock_version: number;
  };
  created_at: string;
}

// ─── Stock Movements (History) ────────────────────────────────
export interface StockMovementItem {
  movement_id: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  movement_type: StockMovementType;
  quantity: number;
  cost?: number | null;
  supplier?: string | null;
  reason?: string | null;
  image_path?: string | null;
  expired_at?: string | null;
  created_at: string;
}

export interface GetStockMovementsRequest {
  product_id?: number;
  movement_type?: StockMovementType | string;
  date_from?: string;
  date_to?: string;
  product_name?: string;
  barcode?: string;
  page?: number;
  limit?: number;
}

export interface GetStockMovementsResponse {
  movements: StockMovementItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockAdjustRequest {
  product_id: number;
  quantity: number;
  reason?: string;
}

export interface StockAdjustResponse {
  movement_id: number;
  product_id: number;
  movement_type: StockMovementType;
  quantity: number;
  reason?: string | null;
  stock: {
    stock_id: number;
    quantity: number;
    stock_version: number;
  };
  created_at: string;
}
