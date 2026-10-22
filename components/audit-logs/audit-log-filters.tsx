'use client';

import React from 'react';
import { AuditFilterOptions } from '../../services/auditLogService';
import { useLanguage } from '../../contexts/language-context';

interface AuditLogFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedAction: string;
  onActionChange: (val: string) => void;
  selectedEntityType: string;
  onEntityTypeChange: (val: string) => void;
  selectedUserId: string;
  onUserIdChange: (val: string) => void;
  datePreset: 'all' | 'today' | '7days' | '30days' | 'custom';
  onDatePresetChange: (preset: 'all' | 'today' | '7days' | '30days' | 'custom') => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  filterOptions: AuditFilterOptions | null;
  onReset: () => void;
  hasActiveFilters: boolean;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export function AuditLogFilters({
  search,
  onSearchChange,
  selectedAction,
  onActionChange,
  selectedEntityType,
  onEntityTypeChange,
  selectedUserId,
  onUserIdChange,
  datePreset,
  onDatePresetChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  filterOptions,
  onReset,
  hasActiveFilters,
  isAutoRefresh,
  onToggleAutoRefresh,
}: AuditLogFiltersProps) {
  const { t } = useLanguage();

  const getActionLabel = (act: string) => {
    switch (act) {
      case 'CREATE_ORDER':
        return t('audit.action_opt_sale', 'Completed Checkout Sale');
      case 'UPDATE_ORDER':
        return t('audit.action_opt_update_order', 'Updated Order Record');
      case 'CANCEL_ORDER':
        return t('audit.action_opt_cancel_order', 'Cancelled / Voided Order');
      case 'STOCK_IN':
        return t('audit.action_opt_stock_in', 'Stock In Delivery');
      case 'STOCK_OUT':
        return t('audit.action_opt_stock_out', 'Stock Out');
      case 'ADJUST_STOCK':
        return t('audit.action_opt_adjust_stock', 'Manual Stock Adjustment');
      case 'CREATE_PRODUCT':
        return t('audit.action_opt_create_product', 'Created New Product');
      case 'UPDATE_PRODUCT':
        return t('audit.action_opt_update_product', 'Updated Product');
      case 'DELETE_PRODUCT':
        return t('audit.action_opt_delete_product', 'Deleted Product');
      case 'CREATE_USER':
        return t('audit.action_opt_create_user', 'Created User Account');
      case 'UPDATE_USER':
        return t('audit.action_opt_update_user', 'Updated User Account');
      case 'DEACTIVATE_USER':
        return t('audit.action_opt_deactivate_user', 'Deactivated User');
      case 'EXPORT_AUDIT_LOGS':
        return t('audit.action_opt_export_audit', 'Exported Audit Logs');
      default:
        return act;
    }
  };

  const getEntityLabel = (ent: string) => {
    switch (ent) {
      case 'Order':
        return t('audit.res_order', 'Orders & Sales');
      case 'Product':
        return t('audit.res_product', 'Product Catalog');
      case 'StockMovement':
        return t('audit.res_stock', 'Stock Inventory');
      case 'User':
        return t('audit.res_user', 'Users & Staff');
      case 'Customer':
        return t('audit.res_customer', 'Customer Accounts');
      case 'AuditLog':
        return t('audit.res_audit', 'Audit Logs');
      default:
        return ent;
    }
  };

  return (
    <div className="bg-card border border-border/40 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 select-none">
      {/* Search and Main Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/45 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('audit.search_placeholder', 'Search staff, receipt, resource, IP...')}
            className="w-full pl-11 pr-9 py-2.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200 min-h-[42px]"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5 cursor-pointer"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Staff / Actor Dropdown */}
        <div>
          <select
            value={selectedUserId}
            onChange={(e) => onUserIdChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200 min-h-[42px] text-foreground cursor-pointer"
          >
            <option value="">{t('audit.all_staff', 'All Staff & Cashiers')}</option>
            {filterOptions?.users?.map((u) => (
              <option key={u.userId} value={String(u.userId)}>
                {u.fullName ? `${u.fullName} (${u.username})` : u.username} - {u.role}
              </option>
            ))}
          </select>
        </div>

        {/* Action Dropdown */}
        <div>
          <select
            value={selectedAction}
            onChange={(e) => onActionChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200 min-h-[42px] text-foreground cursor-pointer"
          >
            <option value="">{t('audit.all_operations', 'All Operations')}</option>
            {filterOptions?.actions?.map((act) => (
              <option key={act} value={act}>
                {getActionLabel(act)}
              </option>
            ))}
          </select>
        </div>

        {/* Resource / Entity Type Dropdown */}
        <div>
          <select
            value={selectedEntityType}
            onChange={(e) => onEntityTypeChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200 min-h-[42px] text-foreground cursor-pointer"
          >
            <option value="">{t('audit.all_resources', 'All Resources')}</option>
            {filterOptions?.entityTypes?.map((ent) => (
              <option key={ent} value={ent}>
                {getEntityLabel(ent)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Presets & Custom Dates Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/30">
        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-foreground/45 mr-1.5">
            {t('audit.period', 'Period:')}
          </span>
          {(['all', 'today', '7days', '30days', 'custom'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => onDatePresetChange(preset)}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-150 cursor-pointer ${
                datePreset === preset
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-secondary/40 text-foreground/70 hover:bg-secondary hover:text-foreground'
              }`}
            >
              {preset === 'all'
                ? t('audit.all_time', 'All Time')
                : preset === 'today'
                ? t('audit.today', 'Today')
                : preset === '7days'
                ? t('audit.last_7_days', 'Last 7 Days')
                : preset === '30days'
                ? t('audit.last_30_days', 'Last 30 Days')
                : t('audit.custom', 'Custom')}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers when 'custom' is active */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 font-semibold text-foreground outline-none focus:border-primary"
            />
            <span className="text-xs text-foreground/40 font-bold">{t('audit.date_to', 'to')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 font-semibold text-foreground outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Reset & Auto-refresh Controls */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Live Auto-refresh toggle */}
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              isAutoRefresh
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-secondary/30 text-foreground/60 border-border/40 hover:bg-secondary/50'
            }`}
            title="Toggle 15s auto-refresh"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAutoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-foreground/30'
              }`}
            />
            <span>{isAutoRefresh ? t('audit.live_auto_refresh', 'Live (15s)') : t('audit.auto_refresh_off', 'Auto-refresh Off')}</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{t('audit.reset_filters', 'Reset')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
