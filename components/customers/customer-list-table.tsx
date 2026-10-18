'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CustomerWithPurchases } from '../../services/customerService';
import { useLanguage } from '../../contexts/language-context';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../libs/utils';
import TablePagination from '../ui/table-pagination';

interface CustomerListTableProps {
  customers: CustomerWithPurchases[];
  isLoading: boolean;
  errorMessage: string | null;
  onEdit: (customer: CustomerWithPurchases) => void;
  onViewDetail: (customer: CustomerWithPurchases) => void;
  onRetry: () => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function CustomerListTable({
  customers,
  isLoading,
  errorMessage,
  onEdit,
  onViewDetail,
  onRetry,
  currentPage,
  totalPages,
  totalEntries,
  pageSize = 10,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: CustomerListTableProps) {
  const { t } = useLanguage();
  const { can } = useAuth();
  const canEditCustomer = can('customers.manage', 'update');
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <span className="text-xs font-bold text-foreground/50 tracking-wide mt-2">
          {t('customers.loading', 'Retrieving pharmacy customer directory...')}
        </span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 text-center max-w-md mx-auto py-20 select-none">
        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4 border border-destructive/20 shadow-sm">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-black text-foreground">{t('common.error', 'Unable to Load Customers')}</h3>
        <p className="text-xs text-foreground/55 mt-1.5 mb-5 leading-relaxed">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold shadow-sm cursor-pointer"
        >
          {t('common.try_again', 'Try Again')}
        </button>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-24 max-w-sm mx-auto select-none">
        <div className="w-16 h-16 bg-secondary/35 text-foreground/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/10">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-base font-black text-foreground">{t('customers.no_customers', 'No Customers Found')}</h3>
        <p className="text-xs text-foreground/50 mt-1.5 leading-relaxed">
          {t('customers.no_customers_desc', 'No registered customer records match your query. Clear filters or register a new customer.')}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Cards Layout (< md) */}
      <div className="block md:hidden divide-y divide-border/10 p-4 space-y-4">
        {customers.map((c) => {
          const debt = Number(c.totalDebt || 0);
          return (
            <div key={c.customerId} className="pt-4 first:pt-0 space-y-3 select-none">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/80 to-accent text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                    {getInitials(c.fullName || 'Customer')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-1.5 py-0.5 rounded">
                        #{c.customerId}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground mt-0.5 leading-snug">{c.fullName || 'Unnamed Customer'}</h4>
                    <span className="text-[10px] text-foreground/40 font-semibold block">
                      Member since {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-foreground block">${Number(c.totalPaid || 0).toFixed(2)}</span>
                  <span className="text-[10px] text-foreground/40 block font-semibold">Total spent</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/70 bg-secondary/15 p-2.5 rounded-xl">
                {c.phone ? (
                  <span className="font-mono font-bold flex items-center gap-1">
                    📞 {c.phone}
                  </span>
                ) : (
                  <span className="italic text-foreground/30">No phone</span>
                )}
                {c.email && (
                  <span className="truncate">✉️ {c.email}</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/10 text-xs">
                <div>
                  {debt > 0 ? (
                    <Link
                      href="/admin/customers/debt"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      Debt: ${debt.toFixed(2)}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Clean ($0.00)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetail(c)}
                    className="px-3 py-1 rounded-lg bg-secondary/50 text-foreground/75 font-bold text-xs hover:bg-secondary cursor-pointer"
                  >
                    View
                  </button>
                  {canEditCustomer && (
                    <button
                      onClick={() => onEdit(c)}
                      className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/15 select-none">
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45 w-16">ID</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('customers.col_customer', 'Customer Profile')}</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('customers.col_contact', 'Contact Details')}</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('customers.col_member_since', 'Member Since')}</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('customers.col_total_spent', 'Lifetime Spent')}</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('customers.col_debt_status', 'Debt Balance')}</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45 text-right w-32">{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {customers.map((c) => {
              const debt = Number(c.totalDebt || 0);

              return (
                <tr key={c.customerId} className="hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-colors duration-150 group">
                  
                  {/* Customer ID */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-2 py-1 rounded-lg">
                      #{c.customerId}
                    </span>
                  </td>

                  {/* Customer Profile (Avatar & Name) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/80 to-accent text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                        {getInitials(c.fullName || 'Customer')}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {c.fullName || 'Unnamed Customer'}
                        </span>
                        <span className="text-[10px] text-foreground/40 font-semibold mt-0.5">
                          {c.lastBuyAt
                            ? `Last visit: ${new Date(c.lastBuyAt).toLocaleDateString()}`
                            : 'No purchases yet'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {c.phone ? (
                        <span className="text-xs font-mono font-bold text-foreground/75 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-foreground/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-foreground/30 italic font-medium">No phone</span>
                      )}
                      
                      {c.email && (
                        <span className="text-[11px] text-foreground/50 truncate flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-foreground/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {c.email}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Registered Date */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-foreground/75">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Total Paid */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-extrabold text-foreground">
                      ${Number(c.totalPaid || 0).toFixed(2)}
                    </span>
                  </td>

                  {/* Debt Status */}
                  <td className="px-6 py-4">
                    {debt > 0 ? (
                      <Link
                        href="/admin/customers/debt"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all select-none"
                        title="Click to manage debt payments"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shrink-0"></span>
                        Debt: ${debt.toFixed(2)}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-success/10 text-success border border-success/20 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0"></span>
                        Clean ($0.00)
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right relative select-none">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetail(c)}
                        className="px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground/75 hover:text-foreground text-xs font-bold transition-all cursor-pointer border border-border/20 shadow-sm flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-foreground/50" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>View</span>
                      </button>

                      {canEditCustomer && (
                        <button
                          onClick={() => onEdit(c)}
                          className="w-8 h-8 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground/60 hover:text-foreground flex items-center justify-center cursor-pointer transition-colors border border-border/20 shadow-sm"
                          title="Edit Profile"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
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

      {/* Pagination Footer */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        entryLabel={t('customers.customer', 'customers').toLowerCase()}
      />
    </>
  );
}
