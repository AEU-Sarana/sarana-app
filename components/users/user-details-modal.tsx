'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../../features/user/types';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { getInitials } from '../../libs/utils';
import { useLanguage } from '../../contexts/language-context';

interface UserDetailsModalProps {
  isOpen: boolean;
  userId: number | null;
  onClose: () => void;
}

export function UserDetailsModal({
  isOpen,
  userId,
  onClose,
}: UserDetailsModalProps) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<{ featureKey: string; actions: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetails(userId);
    }
  }, [isOpen, userId]);

  const fetchDetails = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch full user details from GET /api/v1/users/:id
      const data = await userService.getUser(id);
      setUser(data);

      // Fetch user assigned permissions
      if (data.role !== 'ADMIN') {
        const permRes = await authService.getUserPermissions(id);
        setPermissions(permRes?.data?.permissions || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch user details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-card border border-border/80 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-foreground">{t('user_details_modal.title', 'User Account Details')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-foreground/50">{t('user_details_modal.loading', 'Fetching user information details...')}</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
              {error}
            </div>
          ) : user ? (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-secondary/20 border border-border/30">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                  {getInitials(user.fullName)}
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-lg font-black text-foreground">{user.fullName}</h3>
                    <span className="text-xs font-mono font-bold text-foreground/50 bg-secondary/60 px-2 py-0.5 rounded-md">
                      #{user.userId}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground/50 mt-0.5">@{user.username}</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                    {user.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/15">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {t('common.administrator', 'Administrator')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-bold border border-success/15">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {t('common.cashier', 'Cashier')}
                      </span>
                    )}

                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-bold border border-success/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        {t('user_details_modal.active_account', 'Active Account')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        {t('user_details_modal.inactive_account', 'Inactive Account')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* General Metadata Information Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-foreground/40 uppercase tracking-wider font-sans border-b border-border/30 pb-1">
                  {t('user_details_modal.account_details_contact', 'ACCOUNT DETAILS & CONTACT')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground/40 font-bold block text-[10px] uppercase">{t('user_details_modal.email_address', 'EMAIL ADDRESS')}</span>
                    <span className="text-foreground font-semibold mt-1 block truncate">{user.email || '—'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground/40 font-bold block text-[10px] uppercase">{t('user_details_modal.phone_number', 'PHONE NUMBER')}</span>
                    <span className="text-foreground font-semibold mt-1 block">{user.phone || t('user_details_modal.not_provided', 'Not provided')}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground/40 font-bold block text-[10px] uppercase">{t('user_details_modal.authorized_device_id', 'AUTHORIZED DEVICE ID')}</span>
                    <span className="text-foreground font-semibold mt-1 block font-mono text-[11px] truncate">
                      {user.deviceId || t('user_details_modal.not_bound', 'Not Bound')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground/40 font-bold block text-[10px] uppercase">{t('user_details_modal.created_by_user', 'CREATED BY USER')}</span>
                    <span className="text-foreground font-semibold mt-1 block">
                      {user.createdBy ? `User #${user.createdBy}` : t('user_details_modal.system_initialized', 'System Initialized')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground/40 font-bold block text-[10px] uppercase">{t('user_details_modal.created_date', 'CREATED DATE')}</span>
                    <span className="text-foreground font-semibold mt-1 block">
                      {new Date(user.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground/40 font-bold block text-[10px] uppercase">{t('user_details_modal.last_updated', 'LAST UPDATED')}</span>
                    <span className="text-foreground font-semibold mt-1 block">
                      {new Date(user.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Permissions Summary */}
              {user.role === 'CASHIER' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-foreground/40 uppercase tracking-wider font-sans border-b border-border/30 pb-1 flex items-center justify-between">
                    <span>{t('user_details_modal.assigned_permissions', 'ASSIGNED FEATURE PERMISSIONS')}</span>
                    <span className="text-primary font-bold text-[11px]">
                      {t('user_details_modal.enabled_count', '{{count}} ENABLED').replace('{{count}}', String(permissions.length))}
                    </span>
                  </h4>

                  {permissions.length === 0 ? (
                    <p className="text-xs font-semibold text-foreground/40 italic p-3 rounded-xl bg-secondary/20 border border-border/30">
                      {t('user_details_modal.no_permissions', 'No additional feature permissions assigned to this cashier.')}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {permissions.map((p) => (
                        <div
                          key={p.featureKey}
                          className="flex items-start gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-border/30"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-foreground/80 truncate">{p.featureKey}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(Array.isArray(p.actions) ? p.actions : String(p.actions).split(',')).map((action) => (
                                <span
                                  key={action}
                                  className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold"
                                >
                                  {action}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-secondary/20 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary text-foreground text-xs font-extrabold hover:bg-secondary/80 transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
