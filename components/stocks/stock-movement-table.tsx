'use client';

import React from 'react';
import { StockMovementItem } from '../../features/stock/types';
import { MovementBadge } from './movement-badge';
import { useLanguage } from '../../contexts/language-context';

const HISTORY_LIMIT = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${Number(n).toFixed(2)}`;
}

interface StockMovementTableProps {
  movements: StockMovementItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  type: 'stock-in' | 'adjustment';
}

export function StockMovementTable({
  movements,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  type,
}: StockMovementTableProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-7 py-5 border-b border-border/20 bg-secondary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground tracking-tight">
              {type === 'stock-in' ? t('stock_in_page.recent_stock_in', 'Recent Stock In') : t('stock_adjustments_page.recent_adjustments', 'Recent Adjustments')}
            </h2>
            <p className="text-[11px] text-foreground/50 mt-0.5">
              {isLoading ? t('stock_in_page.loading', 'Loading…') : t('common.records_total', '{{count}} records total').replace('{{count}}', String(total))}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-foreground/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-bold text-foreground/35">
            {type === 'stock-in' ? t('stock_in_page.no_records', 'No stock in records yet') : t('stock_adjustments_page.no_records', 'No adjustment records yet')}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-border/10 p-4 space-y-4">
            {movements.map((mv) => (
              <div key={mv.movement_id} className="pt-4 first:pt-0 space-y-3 select-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-1.5 py-0.5 rounded">
                        #{mv.movement_id}
                      </span>
                      <MovementBadge type={mv.movement_type} />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mt-1 leading-snug">{mv.product_name || `Product #${mv.product_id}`}</h4>
                    {mv.product_code && (
                      <span className="text-[10px] font-mono text-foreground/45 mt-0.5 block">{mv.product_code}</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-black ${mv.quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                      {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                    </span>
                    <span className="text-[10px] text-foreground/40 block font-semibold">quantity</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-2 border-t border-border/10 text-xs text-foreground/60 font-semibold">
                  {type === 'stock-in' && (
                    <div className="flex flex-wrap justify-between items-center gap-2 text-[11px]">
                      <span>Cost: <strong className="text-foreground">{formatCurrency(mv.cost ?? null)}</strong></span>
                      <span>Supplier: <strong className="text-foreground">{mv.supplier || '—'}</strong></span>
                      {mv.expired_at && <span>Exp: <strong className="text-amber-600">{new Date(mv.expired_at).toLocaleDateString()}</strong></span>}
                    </div>
                  )}
                  {type === 'adjustment' && mv.reason && (
                    <div className="text-[11px]">
                      Reason: <span className="text-foreground font-medium">{mv.reason}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-foreground/40 text-right mt-1">
                    {formatDate(mv.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/20 bg-secondary/15 select-none">
                  <th className="px-6 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40 w-16">ID</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('stock.col_product', 'Product')}</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('common.type', 'Type')}</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('stock_in_page.quantity', 'Qty')}</th>
                  {type === 'stock-in' && (
                    <>
                      <th className="px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('stock_in_page.cost_per_unit', 'Cost/Unit')}</th>
                      <th className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('stock_in_page.supplier', 'Supplier')}</th>
                      <th className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('stock_in_page.expiry_date', 'Expiry')}</th>
                    </>
                  )}
                  {type === 'adjustment' && (
                    <th className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('products.description_note', 'Reason / Note')}</th>
                  )}
                  <th className="px-6 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">{t('sales.col_date', 'Date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {movements.map((mv) => (
                  <tr key={mv.movement_id} className="hover:bg-secondary/20 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-2 py-1 rounded-lg">
                        #{mv.movement_id}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${type === 'stock-in' ? 'bg-success/10' : 'bg-amber-500/10'}`}>
                          <svg className={`w-3.5 h-3.5 ${type === 'stock-in' ? 'text-success' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{mv.product_name || `Product #${mv.product_id}`}</p>
                          {mv.product_code && (
                            <p className="text-[10px] text-foreground/40 font-semibold">{mv.product_code}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4">
                      <MovementBadge type={mv.movement_type} />
                    </td>

                    {/* Qty */}
                    <td className={`px-4 py-4 text-right font-extrabold ${mv.quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                      {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                    </td>

                    {/* Cost/Supplier/Expiry (Stock In Only) */}
                    {type === 'stock-in' && (
                      <>
                        <td className="px-4 py-4 text-right font-semibold text-foreground/70">
                          {formatCurrency(mv.cost ?? null)}
                        </td>
                        <td className="px-4 py-4 text-foreground/60 font-semibold">
                          {mv.supplier || '—'}
                        </td>
                        <td className="px-4 py-4 text-foreground/60 font-semibold">
                          {mv.expired_at ? new Date(mv.expired_at).toLocaleDateString() : '—'}
                        </td>
                      </>
                    )}

                    {/* Reason (Adjustment Only) */}
                    {type === 'adjustment' && (
                      <td className="px-4 py-4 text-foreground/60 font-semibold">
                        {mv.reason || '—'}
                      </td>
                    )}

                    {/* Date */}
                    <td className="px-6 py-4 text-foreground/50 font-semibold whitespace-nowrap">
                      {formatDate(mv.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && total > HISTORY_LIMIT && (
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

                {/* Page numbers */}
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
