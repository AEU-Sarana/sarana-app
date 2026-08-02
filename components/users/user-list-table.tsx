'use client';

import React from 'react';
import { User } from '../../features/user/types';
import { useLanguage } from '../../contexts/language-context';
import { useAuth } from '../../hooks/useAuth';

const PAGE_LIMIT = 10;

interface UserListTableProps {
  users: User[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onManagePermissions?: (user: User) => void;
  onViewDetails?: (user: User) => void;
  currentUserId?: number | null;
}

export function UserListTable({
  users,
  isLoading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onEdit,
  onDeactivate,
  onManagePermissions,
  onViewDetails,
  currentUserId,
}: UserListTableProps) {
  const { t } = useLanguage();
  const { can } = useAuth();
  const canUpdateUser = can('users.manage', 'update');
  const canDeleteUser = can('users.manage', 'delete');

  return (
    <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 mx-6 my-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="divide-y divide-border/10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4.5 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-secondary/40 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-secondary/40 rounded-lg w-2/5" />
                <div className="h-2.5 bg-secondary/30 rounded-lg w-1/4" />
              </div>
              <div className="h-3 bg-secondary/30 rounded-lg w-16" />
              <div className="h-6 bg-secondary/30 rounded-lg w-20" />
              <div className="h-3 bg-secondary/30 rounded-lg w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Table Content */}
      {!isLoading && !error && (
        <>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-foreground/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-foreground/35">{t('users.title', 'No users found')}</p>
              <p className="text-xs text-foreground/25 font-semibold">{t('pos.no_products_desc', 'Try adjusting your search filters or add a new user')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/15 select-none">
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45 w-16">ID</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('users.user_info', 'User Info')}</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('users.contact', 'Contact')}</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('users.role', 'Role')}</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('users.status', 'Status')}</th>
                    <th className="px-6 py-4.5 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {users.map((user) => {
                    const isSelf = currentUserId === user.userId;
                    return (
                      <tr key={user.userId} className="hover:bg-secondary/15 transition-colors group">
                        {/* ID */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-2 py-1 rounded-lg">
                            #{user.userId}
                          </span>
                        </td>

                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8.5 h-8.5 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <svg className="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-foreground">{user.fullName}</p>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-[9px] font-black rounded-md uppercase tracking-wide">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-foreground/45 font-semibold mt-0.5">@{user.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-xs text-foreground/75 font-semibold">{user.email || '—'}</p>
                            {user.phone && <p className="text-[10px] text-foreground/45 font-medium">{user.phone}</p>}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
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
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {user.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-extrabold select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                              {t('common.active', 'Active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-extrabold select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              {t('common.inactive', 'Inactive')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onViewDetails && (
                              <button
                                onClick={() => onViewDetails(user)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border/40 text-foreground/75 hover:text-foreground text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-sm"
                                title="View User Information Details"
                              >
                                <svg className="w-3.5 h-3.5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {t('common.view', 'View')}
                              </button>
                            )}

                            {onManagePermissions && user.role !== 'ADMIN' && (
                              <button
                                onClick={() => onManagePermissions(user)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Manage Feature Permissions"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                {t('common.permissions', 'Permissions')}
                              </button>
                            )}

                            {canUpdateUser && (
                              <button
                                onClick={() => onEdit(user)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border/40 text-foreground/75 hover:text-foreground text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Edit User Profile"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('common.edit', 'Edit')}
                              </button>
                            )}

                            {canDeleteUser && (
                              <button
                                disabled={isSelf}
                                onClick={() => onDeactivate(user)}
                                className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all border shadow-sm ${
                                  isSelf
                                    ? 'bg-secondary/40 border-border text-foreground/35 opacity-55 cursor-not-allowed select-none'
                                    : user.status === 'active'
                                    ? 'bg-destructive/10 hover:bg-destructive/20 border-destructive/15 text-destructive cursor-pointer'
                                    : 'bg-primary/10 hover:bg-primary/20 border-primary/15 text-primary cursor-pointer'
                                }`}
                                title={isSelf ? 'Cannot deactivate your own account' : user.status === 'active' ? 'Deactivate User' : 'Reactivate User'}
                              >
                                {user.status === 'active' ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    {t('common.deactivate', 'Deactivate')}
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
                                    </svg>
                                    {t('common.reactivate', 'Reactivate')}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && total > PAGE_LIMIT && (
            <div className="px-6 py-4.5 border-t border-border/20 bg-secondary/5 flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
              <span className="text-xs text-foreground/45 font-semibold">
                {t('common.showing_page', 'Showing page {{page}} of {{totalPages}} ({{total}} entries found)')
                  .replace('{{page}}', String(page))
                  .replace('{{totalPages}}', String(totalPages))
                  .replace('{{total}}', String(total))}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  className="w-8.5 h-8.5 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card disabled:cursor-not-allowed transition-all duration-150 cursor-pointer flex items-center justify-center shadow-sm"
                  title="Previous Page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  const isCurrent = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      className={`w-8.5 h-8.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                        isCurrent
                          ? 'bg-gradient-to-tr from-primary to-accent text-white shadow-md shadow-primary/20 border border-transparent'
                          : 'border border-border bg-card text-foreground/75 hover:bg-secondary'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  className="w-8.5 h-8.5 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card disabled:cursor-not-allowed transition-all duration-150 cursor-pointer flex items-center justify-center shadow-sm"
                  title="Next Page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
