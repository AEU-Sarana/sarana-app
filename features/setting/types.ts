export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface AppSetting {
  auto_backup: boolean;
  backup_frequency: BackupFrequency;
  stock_sync_policy: string;
  report_send_enabled?: boolean;
  report_send_time?: string;    // "HH:MM"
  report_send_timezone?: string;
  updated_at: string;
  updated_by: number;
  // Invoice / Receipt info
  store_name?: string;
  store_logo_path?: string | null;
  store_phone?: string | null;
  store_address?: string | null;
  store_tax_id?: string | null;
  store_footer_note?: string | null;
  is_logo_enabled?: boolean;
  is_footer_enabled?: boolean;
}

export interface UpdateSettingsRequest {
  auto_backup: boolean;
  backup_frequency: BackupFrequency;
  stock_sync_policy: string;
  report_send_enabled?: boolean;
  report_send_time?: string;    // "HH:MM"
  report_send_timezone?: string;
  // Invoice / Receipt info (optional)
  store_name?: string;
  store_phone?: string;
  store_address?: string;
  store_tax_id?: string;
  store_footer_note?: string;
  is_logo_enabled?: boolean;
  is_footer_enabled?: boolean;
}
