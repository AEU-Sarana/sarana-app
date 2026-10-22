'use client';

import React from 'react';
import { AuditLogItem } from '../../services/auditLogService';
import TablePagination from '../ui/table-pagination';
import { useLanguage } from '../../contexts/language-context';

interface AuditLogTableProps {
  logs: AuditLogItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSelectLog: (log: AuditLogItem) => void;
}

export function AuditLogTable({
  logs,
  isLoading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  onSelectLog,
}: AuditLogTableProps) {
  const { t } = useLanguage();

  // Helper for human-readable relative time
  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date().getTime();
      const time = new Date(isoString).getTime();
      const diffSec = Math.floor((now - time) / 1000);

      if (diffSec < 60) {
        return t('audit.time_seconds_ago', '{{count}}s ago').replace('{{count}}', String(diffSec));
      }
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) {
        return t('audit.time_minutes_ago', '{{count}}m ago').replace('{{count}}', String(diffMin));
      }
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) {
        return t('audit.time_hours_ago', '{{count}}h ago').replace('{{count}}', String(diffHour));
      }
      const diffDay = Math.floor(diffHour / 24);
      return t('audit.time_days_ago', '{{count}}d ago').replace('{{count}}', String(diffDay));
    } catch {
      return '';
    }
  };

  // Convert raw system actions into clear, human-readable staff activity
  const formatStaffAction = (log: AuditLogItem) => {
    const act = log.action.toUpperCase();
    const details = (log.newValues || log.oldValues || {}) as Record<string, any>;

    if (act === 'CREATE_ORDER') {
      return {
        title: t('audit.action_sale', 'Completed Checkout Sale'),
        subtitle: details.receiptNumber
          ? `${t('audit.action_receipt', 'Receipt #')}${details.receiptNumber}`
          : (log.entityId ? `${t('audit.action_order', 'Order #')}${log.entityId}` : t('audit.action_sale_sub', 'Customer order created')),
        type: 'sale',
      };
    }
    if (act === 'UPDATE_ORDER') {
      return {
        title: t('audit.action_update_order', 'Updated Order Record'),
        subtitle: log.entityId
          ? `${t('audit.action_order', 'Order #')}${log.entityId}`
          : t('audit.action_update_order_sub', 'Order details modified'),
        type: 'update',
      };
    }
    if (act === 'CANCEL_ORDER' || act === 'VOID_ORDER' || act.includes('CANCEL')) {
      return {
        title: t('audit.action_cancel_order', 'Cancelled / Voided Order'),
        subtitle: details.receiptNumber
          ? `${t('audit.action_receipt', 'Receipt #')}${details.receiptNumber}`
          : (details.cancelReason ? `${t('audit.action_cancel_reason', 'Reason:')} ${details.cancelReason}` : t('audit.action_cancel_sub', 'Transaction voided')),
        type: 'cancel',
      };
    }
    if (act === 'STOCK_IN') {
      return {
        title: t('audit.action_stock_in', 'Stock In Delivery'),
        subtitle: details.quantity
          ? t('audit.action_stock_in_sub', 'Added +{{count}} units to stock').replace('{{count}}', String(details.quantity))
          : t('audit.action_stock_in_default', 'Received shipment from supplier'),
        type: 'stock',
      };
    }
    if (act === 'STOCK_OUT') {
      return {
        title: t('audit.action_stock_out', 'Stock Out'),
        subtitle: details.quantity
          ? t('audit.action_stock_out_sub', 'Deducted -{{count}} units').replace('{{count}}', String(details.quantity))
          : t('audit.action_stock_out_default', 'Inventory deducted'),
        type: 'stock',
      };
    }
    if (act === 'ADJUST_STOCK') {
      return {
        title: t('audit.action_adjust_stock', 'Manual Stock Adjustment'),
        subtitle: details.reason
          ? `${t('audit.action_cancel_reason', 'Reason:')} ${details.reason}`
          : (details.quantity ? `${details.quantity > 0 ? '+' : ''}${details.quantity}` : t('audit.action_adjust_sub', 'Inventory count corrected')),
        type: 'stock',
      };
    }
    if (act === 'CREATE_PRODUCT') {
      return {
        title: t('audit.action_create_product', 'Created New Product'),
        subtitle: details.productName || details.name || (log.entityId ? `Product #${log.entityId}` : t('audit.action_create_product_sub', 'Added catalog medicine')),
        type: 'create',
      };
    }
    if (act === 'UPDATE_PRODUCT') {
      return {
        title: t('audit.action_update_product', 'Updated Product Information'),
        subtitle: details.productName || details.name || (log.entityId ? `Product #${log.entityId}` : t('audit.action_update_product_sub', 'Product details updated')),
        type: 'update',
      };
    }
    if (act === 'DELETE_PRODUCT') {
      return {
        title: t('audit.action_delete_product', 'Deleted Product'),
        subtitle: details.productName || (log.entityId ? `Product #${log.entityId}` : t('audit.action_delete_product_sub', 'Removed from catalog')),
        type: 'delete',
      };
    }
    if (act === 'CREATE_USER') {
      return {
        title: t('audit.action_create_user', 'Created User Account'),
        subtitle: details.username || (log.entityId ? `User #${log.entityId}` : t('audit.action_create_user_sub', 'New staff account created')),
        type: 'create',
      };
    }
    if (act === 'UPDATE_USER') {
      return {
        title: t('audit.action_update_user', 'Updated User Account'),
        subtitle: details.username || (log.entityId ? `User #${log.entityId}` : t('audit.action_update_user_sub', 'Staff account updated')),
        type: 'update',
      };
    }
    if (act === 'DEACTIVATE_USER') {
      return {
        title: t('audit.action_deactivate_user', 'Deactivated User'),
        subtitle: details.username || (log.entityId ? `User #${log.entityId}` : t('audit.action_deactivate_user_sub', 'Staff account suspended')),
        type: 'delete',
      };
    }
    if (act === 'EXPORT_AUDIT_LOGS') {
      return {
        title: t('audit.action_export_audit', 'Exported Audit Logs'),
        subtitle: t('audit.action_export_audit_sub', 'Downloaded activity audit report'),
        type: 'auth',
      };
    }

    // Default formatting
    return {
      title: log.action.replace(/_/g, ' '),
      subtitle: log.entityType ? `${log.entityType} ${log.entityId ? `#${log.entityId}` : ''}` : t('audit.system_event', 'System Event'),
      type: 'generic',
    };
  };

  // Helper for action badge colors
  const getActionTypeClass = (type: string) => {
    switch (type) {
      case 'sale':
      case 'create':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'delete':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'cancel':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'auth':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'stock':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'update':
      default:
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
  };

  // Helper for simple User Agent preview
  const parseBrowser = (ua: string | null) => {
    if (!ua) return 'Terminal';
    if (ua.includes('Edg/')) return 'Edge Browser';
    if (ua.includes('Chrome/')) return 'Chrome Browser';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari Browser';
    if (ua.includes('Firefox/')) return 'Firefox Browser';
    if (ua.includes('Postman')) return 'Postman Client';
    if (ua.includes('curl')) return 'cURL Script';
    return ua.slice(0, 20);
  };

  return (
    <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/15 text-[11px] font-extrabold uppercase tracking-wider text-foreground/50 select-none">
              <th className="py-4 px-6">{t('audit.col_staff', 'Staff Member')}</th>
              <th className="py-4 px-6">{t('audit.col_action', 'What They Did')}</th>
              <th className="py-4 px-6">{t('audit.col_resource', 'Resource / Item')}</th>
              <th className="py-4 px-6">{t('audit.col_date', 'Date & Time')}</th>
              <th className="py-4 px-6">{t('audit.col_device', 'Device / IP')}</th>
              <th className="py-4 px-6">{t('audit.col_status', 'Status / Changes')}</th>
              <th className="py-4 px-6 text-right">{t('audit.col_inspect', 'Inspect')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 font-medium">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-secondary/60" />
                      <div>
                        <div className="h-4 w-24 bg-secondary/60 rounded mb-1" />
                        <div className="h-3 w-16 bg-secondary/40 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 w-36 bg-secondary/60 rounded mb-1" />
                    <div className="h-3 w-24 bg-secondary/40 rounded" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-5 w-20 bg-secondary/60 rounded-md" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 w-24 bg-secondary/60 rounded mb-1" />
                    <div className="h-3 w-16 bg-secondary/40 rounded" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 w-24 bg-secondary/60 rounded" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-5 w-20 bg-secondary/60 rounded-full" />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="h-8 w-16 bg-secondary/60 rounded-xl ml-auto" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-16 px-6 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/40 flex items-center justify-center text-foreground/40 mb-3.5">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {t('audit.no_logs_found', 'No staff activity logs found')}
                    </span>
                    <span className="text-xs text-foreground/50 mt-1">
                      {t('audit.no_logs_desc', 'No staff actions match your current search or date filter.')}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const dateObj = new Date(log.createdAt);
                const hasChanges = Boolean(log.oldValues || log.newValues);
                const changedKeysCount = Math.max(
                  Object.keys(log.oldValues || {}).length,
                  Object.keys(log.newValues || {}).length
                );
                const staffAction = formatStaffAction(log);

                return (
                  <tr
                    key={log.logId}
                    className="hover:bg-secondary/20 transition-colors duration-150 group"
                  >
                    {/* Staff Member (Who did it) */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border border-border/60 flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
                          {log.user?.fullName
                            ? log.user.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            : log.user?.username?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="truncate max-w-[150px]">
                          <div className="text-xs font-bold text-foreground truncate">
                            {log.user?.fullName || log.user?.username || t('audit.system_background', 'System Background')}
                          </div>
                          <div className="text-[10px] text-foreground/50 flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-secondary/80 text-foreground/80 font-bold uppercase tracking-wider text-[9px]">
                              {log.user?.role || 'SYSTEM'}
                            </span>
                            {log.user?.username && log.user?.fullName && (
                              <span className="text-foreground/40 font-mono text-[10px]">
                                @{log.user.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* What They Did */}
                    <td className="py-4 px-6">
                      <div className="min-w-[190px] max-w-[280px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionTypeClass(
                              staffAction.type
                            )}`}
                          >
                            {staffAction.title}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60 truncate" title={staffAction.subtitle}>
                          {staffAction.subtitle}
                        </p>
                      </div>
                    </td>

                    {/* Resource / Affected Item */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {log.entityType ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-secondary/50 text-foreground border border-border/40">
                            {log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="text-xs font-mono font-bold text-foreground/60">
                              #{log.entityId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-foreground/40 italic">
                          {t('audit.system_event', 'System Event')}
                        </span>
                      )}
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-xs font-bold text-foreground">
                        {dateObj.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-foreground/50 flex items-center gap-1.5 mt-0.5">
                        <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>&bull;</span>
                        <span className="text-primary font-bold">{getRelativeTime(log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Client / IP */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-xs font-mono font-medium text-foreground">
                        {log.ipAddress || '127.0.0.1'}
                      </div>
                      <div className="text-[11px] text-foreground/45 flex items-center gap-1 mt-0.5 truncate max-w-[130px]">
                        <span>{parseBrowser(log.userAgent)}</span>
                      </div>
                    </td>

                    {/* Changes Indicator */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {hasChanges ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>
                            {changedKeysCount}{' '}
                            {changedKeysCount === 1
                              ? t('audit.changes_single', 'change')
                              : t('audit.changes_plural', 'changes')}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-foreground/40 italic">
                          {t('audit.action_executed', 'Action executed')}
                        </span>
                      )}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <button
                        onClick={() => onSelectLog(log)}
                        className="px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-foreground/80 text-xs font-bold transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{t('audit.inspect_button', 'Inspect')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        totalEntries={total}
        pageSize={limit}
        pageSizeOptions={[10, 15, 25, 50, 100]}
        onPageChange={onPageChange}
        onPageSizeChange={onLimitChange}
        entryLabel={t('audit.activities', 'activities')}
      />
    </div>
  );
}
