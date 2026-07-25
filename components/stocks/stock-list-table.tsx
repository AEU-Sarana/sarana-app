'use client';

import React from 'react';
import Link from 'next/link';
import { StockListItem } from '../../features/stock/types';
import { StockStatusBadge } from './stock-status-badge';
import { useLanguage } from '../../contexts/language-context';

const PAGE_LIMIT = 10;

interface StockListTableProps {
  stocks: StockListItem[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function StockListTable({
  stocks,
  isLoading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
}: StockListTableProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 mx-6 my-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="divide-y divide-border/10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-secondary/40 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-secondary/40 rounded-lg w-2/5" />
                <div className="h-2.5 bg-secondary/30 rounded-lg w-1/4" />
              </div>
              <div className="h-3 bg-secondary/30 rounded-lg w-16" />
              <div className="h-6 bg-secondary/30 rounded-lg w-20" />
              <div className="h-3 bg-secondary/30 rounded-lg w-10" />
            </div>
          ))}
        </div>
      )}

      {/* Table Content */}
      {!isLoading && !error && (
        <>
          {stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-foreground/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <p className="text-sm font-bold text-foreground/35">{t('products.no_products_found', 'No products found')}</p>
              <p className="text-xs text-foreground/25 font-semibold">{t('pos.no_products_desc', 'Try adjusting your search or filters')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/15 select-none">
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45 w-16">ID</th>
                    <th className="px-6 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('products.col_product', 'Product')}</th>
                    <th className="px-10 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('products.col_category', 'Category')}</th>
                    <th className="px-10 py-4.5 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">{t('stock.current_stock', 'Quantity')}</th>
                    <th className="px-10 py-4.5 text-center text-xs font-bold uppercase tracking-wider text-foreground/45">{t('stock.low_stock_threshold', 'Threshold')}</th>
                    <th className="px-10 py-4.5 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">{t('products.col_status', 'Status')}</th>
                    <th className="px-6 py-4.5 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {stocks.map((item) => (
                    <tr key={item.stock_id} className="hover:bg-secondary/15 transition-colors group">
                      {/* ID */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-2 py-1 rounded-lg">
                          #{item.stock_id}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{item.product_name}</p>
                            <p className="text-[10px] text-foreground/40 font-semibold mt-0.5">
                              {item.product_code}
                              {item.barcode ? ` · ${item.barcode}` : ''}
                              {item.has_expiry && (
                                <span className="ml-1.5 text-amber-500 font-bold">· Expiry</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-10 py-4">
                        {item.category ? (
                          <span className="px-2.5 py-1 bg-secondary/30 text-foreground/60 text-xs font-bold rounded-lg">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-foreground/25 font-semibold">—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-10 py-4 text-right">
                        <span className={`text-sm font-black ${item.quantity <= 0 ? 'text-destructive' :
                          item.low_stock_threshold && item.quantity <= item.low_stock_threshold ? 'text-warning' :
                            'text-foreground'
                        }`}>
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Threshold */}
                      <td className="px-10 py-4 text-center text-foreground/45 font-semibold">
                        {item.low_stock_threshold ?? '—'}
                      </td>

                      {/* Status */}
                      <td className="px-10 py-4">
                        <StockStatusBadge status={item.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href="/admin/stock-in"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-extrabold rounded-lg transition-all"
                            title={t('stock.stock_in', 'Stock In')}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            {t('stock.stock_in', 'Stock In')}
                          </Link>
                          <Link
                            href="/admin/stock-adjustments"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/40 hover:bg-secondary/70 text-foreground/60 hover:text-foreground text-[10px] font-extrabold rounded-lg transition-all"
                            title={t('stock.adjust_stock', 'Adjust')}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {t('stock.adjust_stock', 'Adjust')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && total > PAGE_LIMIT && (
            <div className="px-6 py-4.5 border-t border-border/20 bg-secondary/5 flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
              <span className="text-xs text-foreground/45 font-semibold">
                Showing page {page} of {totalPages} ({total} entries found)
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

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  const isCurrent = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      className={`w-8.5 h-8.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${isCurrent
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
