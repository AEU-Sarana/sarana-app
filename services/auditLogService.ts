import { apiClient } from './apiClient';

export interface AuditUser {
  userId: number;
  username: string;
  fullName: string | null;
  role: string;
  email?: string | null;
  profileImage?: string | null;
}

export interface AuditDiffItem {
  key: string;
  oldValue: any;
  newValue: any;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface AuditLogItem {
  logId: number;
  userId: number | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditUser | null;
}

export interface AuditLogDetail extends AuditLogItem {
  diff: AuditDiffItem[];
}

export interface AuditFilterOptions {
  actions: string[];
  entityTypes: string[];
  users: AuditUser[];
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{
    userId: number;
    username: string;
    fullName: string;
    role: string;
    count: number;
  }>;
  timeline: Array<{ date: string; count: number }>;
}

export interface ListAuditLogsResponse {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const auditLogService = {
  /**
   * Get paginated audit logs
   */
  async getAuditLogs(params?: AuditLogQueryParams): Promise<ListAuditLogsResponse> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.userId) cleanParams.userId = params.userId;
      if (params.action) cleanParams.action = params.action;
      if (params.entityType) cleanParams.entityType = params.entityType;
      if (params.search) cleanParams.search = params.search;
      if (params.dateFrom) cleanParams.dateFrom = params.dateFrom;
      if (params.dateTo) cleanParams.dateTo = params.dateTo;
      if (params.sortBy) cleanParams.sortBy = params.sortBy;
      if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    }

    const response = await apiClient.get<{
      success: boolean;
      data: AuditLogItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/audit-logs', { params: cleanParams });

    return {
      logs: response.data || [],
      pagination: response.pagination,
    };
  },

  /**
   * Get single audit log detail with field diffs
   */
  async getAuditLogById(logId: number): Promise<AuditLogDetail> {
    const response = await apiClient.get<{
      success: boolean;
      data: AuditLogDetail;
    }>(`/audit-logs/${logId}`);

    return response.data;
  },

  /**
   * Get filter dropdown options
   */
  async getFilterOptions(): Promise<AuditFilterOptions> {
    const response = await apiClient.get<{
      success: boolean;
      data: AuditFilterOptions;
    }>('/audit-logs/filters');

    return response.data;
  },

  /**
   * Get audit statistics and timeline
   */
  async getAuditStats(params?: { dateFrom?: string; dateTo?: string }): Promise<AuditStats> {
    const response = await apiClient.get<{
      success: boolean;
      data: AuditStats;
    }>('/audit-logs/stats', { params });

    return response.data;
  },

  /**
   * Export audit logs to CSV and trigger browser download
   */
  async exportAuditLogs(params?: AuditLogQueryParams): Promise<void> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.userId) cleanParams.userId = params.userId;
      if (params.action) cleanParams.action = params.action;
      if (params.entityType) cleanParams.entityType = params.entityType;
      if (params.search) cleanParams.search = params.search;
      if (params.dateFrom) cleanParams.dateFrom = params.dateFrom;
      if (params.dateTo) cleanParams.dateTo = params.dateTo;
    }

    const searchParams = new URLSearchParams();
    Object.entries(cleanParams).forEach(([key, val]) => {
      searchParams.append(key, String(val));
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const url = `${baseUrl}/audit-logs/export?${searchParams.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error('Failed to export audit logs');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
