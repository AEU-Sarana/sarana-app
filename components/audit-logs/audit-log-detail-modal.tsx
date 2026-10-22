'use client';

import React, { useState } from 'react';
import { AuditLogDetail } from '../../services/auditLogService';
import { useLanguage } from '../../contexts/language-context';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logDetail: AuditLogDetail | null;
  isLoading: boolean;
}

export function AuditLogDetailModal({
  isOpen,
  onClose,
  logDetail,
  isLoading,
}: AuditLogDetailModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'diff' | 'old' | 'new'>('diff');
  const [copiedState, setCopiedState] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const formatValue = (val: any) => {
    if (val === null) return <span className="text-foreground/40 italic">null</span>;
    if (val === undefined) return <span className="text-foreground/40 italic">undefined</span>;
    if (typeof val === 'boolean') {
      return (
        <span className={val ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
          {String(val)}
        </span>
      );
    }
    if (typeof val === 'object') {
      return (
        <pre className="text-[11px] font-mono bg-secondary/50 p-2 rounded-lg overflow-x-auto">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  {t('audit.modal_title', 'Audit Log Details')}
                </h3>
                {logDetail && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-secondary text-foreground/70 font-bold">
                    #{logDetail.logId}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/50 mt-0.5">
                {t('audit.modal_subtitle', 'Complete execution payload, diff inspection, and client metadata')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground/60 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoading || !logDetail ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs text-foreground/50 font-medium">
                {t('audit.modal_loading', 'Loading log inspection details...')}
              </span>
            </div>
          ) : (
            <>
              {/* Event Overview Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-secondary/15 p-4 rounded-2xl border border-border/40 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/45 block mb-1">
                    {t('audit.modal_action_type', 'Action')}
                  </span>
                  <span className="font-mono font-bold text-sm text-foreground px-2 py-0.5 rounded bg-secondary/60 inline-block">
                    {logDetail.action}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/45 block mb-1">
                    {t('audit.modal_staff_performer', 'Staff / Performer')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {logDetail.user?.fullName || logDetail.user?.username || t('audit.system_background', 'System Background')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                      {logDetail.user?.role || 'SYSTEM'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/45 block mb-1">
                    {t('audit.modal_target_resource', 'Target Resource')}
                  </span>
                  <span className="font-medium text-foreground">
                    {logDetail.entityType ? `${logDetail.entityType} ${logDetail.entityId ? `(#${logDetail.entityId})` : ''}` : t('audit.general_api', 'General API')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/45 block mb-1">
                    {t('audit.modal_recorded_at', 'Recorded At')}
                  </span>
                  <span className="font-medium text-foreground">
                    {new Date(logDetail.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/45 block mb-1">
                    {t('audit.modal_ip_address', 'IP Address')}
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {logDetail.ipAddress || '127.0.0.1'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/45 block mb-1">
                    {t('audit.modal_user_agent', 'User Agent / Browser')}
                  </span>
                  <span className="font-medium text-foreground/70 truncate block" title={logDetail.userAgent || ''}>
                    {logDetail.userAgent || t('audit.unknown_client', 'Unknown Client')}
                  </span>
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('diff')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'diff'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    {t('audit.modal_tab_diff', 'Field Diff (Before vs After)')} {logDetail.diff?.length ? `(${logDetail.diff.length})` : ''}
                  </button>

                  <button
                    onClick={() => setActiveTab('old')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'old'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    {t('audit.modal_tab_old', 'Raw Old State')}
                  </button>

                  <button
                    onClick={() => setActiveTab('new')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'new'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    {t('audit.modal_tab_new', 'Raw New State')}
                  </button>
                </div>

                {/* Copy JSON Button */}
                {(activeTab === 'old' || activeTab === 'new') && (
                  <button
                    onClick={() => {
                      const data = activeTab === 'old' ? logDetail.oldValues : logDetail.newValues;
                      handleCopy(JSON.stringify(data, null, 2), activeTab);
                    }}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {copiedState === activeTab
                        ? t('audit.modal_copied', 'Copied!')
                        : t('audit.modal_copy_json', 'Copy JSON')}
                    </span>
                  </button>
                )}
              </div>

              {/* Tab 1: Changes Diff Table */}
              {activeTab === 'diff' && (
                <div>
                  {logDetail.diff && logDetail.diff.length > 0 ? (
                    <div className="border border-border/50 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-secondary/20 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                            <th className="py-2.5 px-3 w-1/4">{t('audit.modal_field_changed', 'Field Changed')}</th>
                            <th className="py-2.5 px-3 w-3/8">{t('audit.modal_prev_value', 'Previous Value')}</th>
                            <th className="py-2.5 px-3 w-3/8">{t('audit.modal_new_value', 'New Updated Value')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {logDetail.diff.map((item) => (
                            <tr key={item.key} className="hover:bg-secondary/10">
                              <td className="py-3 px-3 font-mono font-bold text-foreground">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.key}</span>
                                  {item.status === 'added' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                      +{t('audit.modal_badge_added', 'Added')}
                                    </span>
                                  )}
                                  {item.status === 'removed' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                      -{t('audit.modal_badge_removed', 'Removed')}
                                    </span>
                                  )}
                                  {item.status === 'modified' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                      {t('audit.modal_badge_modified', 'Modified')}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Old Value */}
                              <td className="py-3 px-3">
                                <div className="p-2 rounded-lg bg-rose-500/5 text-rose-700 dark:text-rose-300 font-mono text-[11px] overflow-x-auto">
                                  {formatValue(item.oldValue)}
                                </div>
                              </td>

                              {/* New Value */}
                              <td className="py-3 px-3">
                                <div className="p-2 rounded-lg bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] overflow-x-auto">
                                  {formatValue(item.newValue)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-10 px-4 text-center border border-dashed border-border/60 rounded-2xl bg-secondary/5">
                      <span className="text-xs text-foreground/50 block font-medium">
                        {t('audit.modal_no_diff', 'No field-level changes were recorded for this action.')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Raw Old Values */}
              {activeTab === 'old' && (
                <div className="relative">
                  <pre className="p-4 rounded-2xl bg-secondary/30 border border-border/50 font-mono text-xs text-foreground overflow-x-auto max-h-80">
                    {logDetail.oldValues ? JSON.stringify(logDetail.oldValues, null, 2) : t('audit.no_prev_values', 'No previous values recorded (null)')}
                  </pre>
                </div>
              )}

              {/* Tab 3: Raw New Values */}
              {activeTab === 'new' && (
                <div className="relative">
                  <pre className="p-4 rounded-2xl bg-secondary/30 border border-border/50 font-mono text-xs text-foreground overflow-x-auto max-h-80">
                    {logDetail.newValues ? JSON.stringify(logDetail.newValues, null, 2) : t('audit.no_new_values', 'No new values recorded (null)')}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-secondary/10 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {t('audit.modal_close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
