import { apiClient } from './apiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BackupListItem {
  backup_id: number;
  backup_name: string;
  file_size: number;
  created_at: string;
}

export interface ListBackupsResponse {
  backups: BackupListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBackupResponse {
  backup_id: number;
  backup_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export interface RestoreBackupResponse {
  restored: boolean;
  restored_at: string;
}

export interface ExportResponse {
  file_url: string;
  file_name: string;
  expires_at: string;
}

export const backupService = {
  async listBackups(page = 1, limit = 20): Promise<ListBackupsResponse> {
    const response = await apiClient.get<ApiResponse<ListBackupsResponse>>('/backup/list', {
      params: { page, limit },
    });
    return response.data;
  },

  async createBackup(data: { backup_name: string; include_data: boolean }): Promise<CreateBackupResponse> {
    const response = await apiClient.post<ApiResponse<CreateBackupResponse>>('/backup/create', data);
    return response.data;
  },

  async restoreBackup(backupId: number): Promise<RestoreBackupResponse> {
    const response = await apiClient.post<ApiResponse<RestoreBackupResponse>>('/backup/restore', {
      backup_id: backupId,
    });
    return response.data;
  },

  async exportData(format: 'CSV' | 'PDF', table: string): Promise<ExportResponse> {
    const response = await apiClient.get<ApiResponse<ExportResponse>>('/backup/export', {
      params: { format, table },
    });
    return response.data;
  },
};
