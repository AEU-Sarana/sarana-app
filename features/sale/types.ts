export interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

export interface Order {
  order_id: number;
  receipt_number: string;
  shift_id?: number | null;
  seller_id: number;
  seller_name: string | null;
  order_date: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  service_fee: number;
  exchange_rate: number;
  payment_method: string;
  has_receipt_link: boolean;
  receipt_link_status: string | null;
  created_at: string;
  received_amount?: number;
  order_status?: 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELLED';
  cancel_reason?: string | null;
  cancel_requested_at?: string | null;
  cancel_requested_by?: number | null;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  rejection_reason?: string | null;
  items?: OrderItem[];
}

export interface ListOrdersRequest {
  page?: number;
  limit?: number;
  seller_id?: number | string;
  start_date?: string;
  end_date?: string;
}

export interface ListOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
