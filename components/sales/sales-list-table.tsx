'use client';

import React from 'react';
import { Order } from '../../features/sale/types';

const PAGE_LIMIT = 10;

interface SalesListTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetails: (order: Order) => void;
}

export function SalesListTable({
  orders,
  isLoading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onViewDetails,
}: SalesListTableProps) {
  const formatUSD = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatKHR = (n: number, rate: number = 4000) => {
    const khr = Math.round(n * rate);
    return `${khr.toLocaleString()} KHR`;
  };

  const getPaymentMethodBadge = (method: string) => {
    const cleanMethod = (method || 'CASH').toUpperCase();
    let classes = 'bg-secondary/40 border-border text-foreground/75';
    
    if (cleanMethod === 'CASH') {
      classes = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    } else if (cleanMethod === 'ABA' || cleanMethod === 'BANK' || cleanMethod === 'KHQR') {
      classes = 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400';
    } else if (cleanMethod === 'CARD') {
      classes = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-extrabold tracking-wider ${classes}`}>
        {cleanMethod}
      </span>
    );
  };

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
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-secondary/40 rounded-lg w-1/3" />
                <div className="h-2.5 bg-secondary/30 rounded-lg w-1/5" />
              </div>
              <div className="h-3 bg-secondary/30 rounded-lg w-20" />
              <div className="h-6 bg-secondary/30 rounded-lg w-16" />
              <div className="h-3 bg-secondary/30 rounded-lg w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Table Content */}
      {!isLoading && !error && (
        <>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-foreground/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-bold text-foreground/35">No transactions found</p>
              <p className="text-xs text-foreground/25 font-semibold">Try adjusting your filters or date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/15 select-none">
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Receipt Number</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Date & Time</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Seller</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Payment Method</th>
                    <th className="px-6 py-4.5 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">Discount</th>
                    <th className="px-6 py-4.5 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">Total Amount</th>
                    <th className="px-6 py-4.5 text-right text-xs font-bold uppercase tracking-wider text-foreground/45 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {orders.map((order) => {
                    const formattedDate = new Date(order.order_date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });
                    
                    return (
                      <tr key={order.order_id} className="hover:bg-secondary/15 transition-colors group">
                        {/* Receipt Number */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-foreground bg-secondary/40 border border-border/20 px-2 py-1 rounded-lg">
                            {order.receipt_number}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="px-6 py-4">
                          <span className="text-xs text-foreground/75 font-semibold">
                            {formattedDate}
                          </span>
                        </td>

                        {/* Seller */}
                        <td className="px-6 py-4">
                          <span className="text-xs text-foreground/75 font-semibold">
                            {order.seller_name || `User #${order.seller_id}`}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="px-6 py-4">
                          {getPaymentMethodBadge(order.payment_method)}
                        </td>

                        {/* Discount */}
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs font-semibold ${order.discount_amount > 0 ? 'text-emerald-500' : 'text-foreground/40'}`}>
                            {order.discount_amount > 0 ? `-${formatUSD(order.discount_amount)}` : '—'}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-foreground">
                              {formatUSD(order.total_amount)}
                            </span>
                            <span className="text-[9px] font-semibold text-foreground/45 mt-0.5">
                              {formatKHR(order.total_amount, order.exchange_rate)}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => onViewDetails(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border/40 text-foreground/75 hover:text-foreground text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-sm"
                            title="View Receipt Details"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
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
                Showing page {page} of {totalPages} ({total} transactions found)
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
