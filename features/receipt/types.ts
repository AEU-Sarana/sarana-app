export interface ReceiptSetting {
  setting_id: number;
  store_name: string;
  logo_path: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  footer_note: string | null;
  is_logo_enabled: boolean;
  is_footer_enabled: boolean;
  updated_at: string;
  created_at: string;
}

export interface UpdateReceiptSettingRequest {
  store_name: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  footer_note?: string;
  is_logo_enabled?: boolean;
  is_footer_enabled?: boolean;
}
