'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  auditLogService,
  AuditLogItem,
  AuditLogDetail,
  AuditFilterOptions,
} from '../../../services/auditLogService';
import { AuditLogFilters } from '../../../components/audit-logs/audit-log-filters';
import { AuditLogTable } from '../../../components/audit-logs/audit-log-table';
import { AuditLogDetailModal } from '../../../components/audit-logs/audit-log-detail-modal';
import { useLanguage } from '../../../contexts/language-context';

export default function AdminAuditLogsPage() {
  const { t } = useLanguage();

  // Data & loading states
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<AuditFilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // Inspection modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [logDetail, setLogDetail] = useState<AuditLogDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate actual ISO date filters based on preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: start.toISOString(), to: undefined };
    }
    if (datePreset === '7days') {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return { from: start.toISOString(), to: undefined };
    }
    if (datePreset === '30days') {
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return { from: start.toISOString(), to: undefined };
    }
    if (datePreset === 'custom') {
      return {
        from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
      };
    }
    return { from: undefined, to: undefined };
  }, [datePreset, dateFrom, dateTo]);

  // Fetch audit logs
  const fetchLogs = useCallback(
    async (targetPage = page, targetLimit = limit) => {
      setIsLoading(true);
      try {
        const { from, to } = getDateRange();
        const res = await auditLogService.getAuditLogs({
          page: targetPage,
          limit: targetLimit,
          search: search.trim() || undefined,
          action: selectedAction || undefined,
          entityType: selectedEntityType || undefined,
          userId: selectedUserId ? parseInt(selectedUserId, 10) : undefined,
          dateFrom: from,
          dateTo: to,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        setLogs(res.logs);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, limit, search, selectedAction, selectedEntityType, selectedUserId, getDateRange]
  );

  // Fetch filter dropdown options once on mount
  useEffect(() => {
    auditLogService
      .getFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // Fetch logs when filters or page change
  useEffect(() => {
    fetchLogs(page, limit);
  }, [page, limit, selectedAction, selectedEntityType, selectedUserId, datePreset, dateFrom, dateTo]);

  // Debounced search trigger
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchLogs(1, limit);
    }, 350);
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchLogs(page, limit);
  };

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(page, limit);
    }, 15000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchLogs, page, limit]);

  // Open log details
  const handleSelectLog = async (log: AuditLogItem) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);
    try {
      const fullDetail = await auditLogService.getAuditLogById(log.logId);
      setLogDetail(fullDetail);
    } catch (error) {
      console.error('Failed to fetch log details:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Export CSV handler
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDateRange();
      await auditLogService.exportAuditLogs({
        search: search.trim() || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        userId: selectedUserId ? parseInt(selectedUserId, 10) : undefined,
        dateFrom: from,
        dateTo: to,
      });
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedAction('');
    setSelectedEntityType('');
    setSelectedUserId('');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
      selectedAction ||
      selectedEntityType ||
      selectedUserId ||
      datePreset !== 'all' ||
      dateFrom ||
      dateTo
  );

  return (
    <div className="space-y-6">
      {/* Action Bar (Top Right buttons) */}
      <div className="flex justify-end items-center select-none">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="group flex-1 sm:flex-initial px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary dark:bg-secondary/20 dark:hover:bg-secondary/35 border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('audit.exporting', 'Exporting...')}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{t('audit.export_csv', 'Export CSV')}</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            title={t('audit.refresh', 'Refresh')}
            className="group flex-1 sm:flex-initial px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary dark:bg-secondary/20 dark:hover:bg-secondary/35 border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${
                isLoading || isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{isLoading || isRefreshing ? t('audit.refreshing', 'Refreshing...') : t('audit.refresh', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <AuditLogFilters
        search={search}
        onSearchChange={handleSearchChange}
        selectedAction={selectedAction}
        onActionChange={(val) => {
          setSelectedAction(val);
          setPage(1);
        }}
        selectedEntityType={selectedEntityType}
        onEntityTypeChange={(val) => {
          setSelectedEntityType(val);
          setPage(1);
        }}
        selectedUserId={selectedUserId}
        onUserIdChange={(val) => {
          setSelectedUserId(val);
          setPage(1);
        }}
        datePreset={datePreset}
        onDatePresetChange={(preset) => {
          setDatePreset(preset);
          setPage(1);
        }}
        dateFrom={dateFrom}
        onDateFromChange={(val) => {
          setDateFrom(val);
          setPage(1);
        }}
        dateTo={dateTo}
        onDateToChange={(val) => {
          setDateTo(val);
          setPage(1);
        }}
        filterOptions={filterOptions}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={() => setIsAutoRefresh((prev) => !prev)}
      />

      {/* Main Staff Audit Logs Table */}
      <AuditLogTable
        logs={logs}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSelectLog={handleSelectLog}
      />

      {/* Inspection Detail Modal */}
      <AuditLogDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLog(null);
          setLogDetail(null);
        }}
        logDetail={logDetail}
        isLoading={isLoadingDetail}
      />
    </div>
  );
}
