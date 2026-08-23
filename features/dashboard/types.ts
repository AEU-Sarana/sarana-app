export interface DashboardTodaySummary {
  total_sales_count: number;
  total_sales_amount: number;
  expected_cash?: number;
}

export interface LowStockWarning {
  product_id: number;
  product_name: string;
  current_stock: number;
  low_stock_threshold: number;
}

export interface DashboardRecentOrderActivity {
  type: 'order';
  order_id: number;
  receipt_number: string;
  seller_name?: string | null;
  total_amount: number;
  created_at: string;
}

export interface DashboardRecentStockMovementActivity {
  type: 'stock_movement';
  movement_id: number;
  product: {
    product_id: number;
    product_name: string;
    image_path: string | null;
  };
  movement_type: string;
  quantity: number;
  created_at: string;
}

export type DashboardActivity = DashboardRecentOrderActivity | DashboardRecentStockMovementActivity;

export interface DashboardSyncStatus {
  pending_orders: number;
  last_sync_time: string | null;
}

export interface TopSellingProduct {
  rank: number;
  product_id: number;
  product_name: string;
  category_name: string | null;
  units_sold: number;
  total_revenue: number;
  image_path: string | null;
}

export interface DashboardOverviewResponse {
  today_summary: DashboardTodaySummary;
  low_stock_warnings?: LowStockWarning[];
  recent_activity?: DashboardActivity[];
  sync_status: DashboardSyncStatus;
  top_products?: TopSellingProduct[];
}
