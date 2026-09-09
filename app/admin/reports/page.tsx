'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { reportService } from '../../../services/reportService';
import { useLanguage } from '../../../contexts/language-context';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TabId       = 'daily' | 'sales' | 'income' | 'stock';
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'negative';
type Period      = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface TopProduct    { product_id: number; product_name: string; product_code: string; quantity_sold: number; revenue: number; average_price: number; }
interface ShiftRow      { seller_id: number; seller_name: string; shift_count: number; total_sales: number; total_orders: number; start_time: string; end_time: string; }
interface LowStockItem  { product_id: number; product_name: string; product_code: string; current_stock: number; low_stock_threshold: number; status: StockStatus; }
interface SalesDay      { date: string; total_sales: number; total_orders: number; total_shifts: number; }
interface StockItem     { product_id: number; product_name: string; product_code: string; category: string; current_stock: number; low_stock_threshold: number; status: StockStatus; }
interface SalesReportItem { date: string; total_sales: number; total_orders: number; total_shifts: number; }

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtUSD   = (n: number) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtFull  = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

// ─── Shared UI Components ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = 'emerald', icon }: {
  label: string; value: string; sub?: string;
  accent?: 'emerald' | 'indigo' | 'sky' | 'rose' | 'amber' | 'orange';
  icon: React.ReactNode;
}) {
  const cfgMap = {
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', glow: 'from-emerald-500/10' },
    indigo:  { text: 'text-indigo-500',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/15',  glow: 'from-indigo-500/10'  },
    sky:     { text: 'text-sky-500',     bg: 'bg-sky-500/10',     border: 'border-sky-500/15',     glow: 'from-sky-500/10'     },
    rose:    { text: 'text-rose-500',    bg: 'bg-rose-500/10',    border: 'border-rose-500/15',    glow: 'from-rose-500/10'    },
    amber:   { text: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/15',   glow: 'from-amber-500/10'   },
    orange:  { text: 'text-orange-500',  bg: 'bg-orange-500/10',  border: 'border-orange-500/15',  glow: 'from-orange-500/10'  },
  };
  const cfg = cfgMap[accent];
  return (
    <div className="relative overflow-hidden bg-card border border-border/40 rounded-3xl p-5 flex flex-col justify-between min-h-[128px] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 shadow-sm select-none">
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br ${cfg.glow} to-transparent blur-2xl`} />
      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border ${cfg.text} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-[10px] uppercase font-black text-foreground/45 tracking-widest">{label}</p>
        <p className="text-xl font-black text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-[9px] font-bold text-foreground/35">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StockStatus }) {
  const { t } = useLanguage();
  const statusCfgMap: Record<StockStatus, { labelKey: string; defaultLabel: string; textCls: string; bgCls: string; dotCls: string }> = {
    in_stock:     { labelKey: 'dashboard.in_stock', defaultLabel: 'In Stock', textCls: 'text-emerald-600 dark:text-emerald-400', bgCls: 'bg-emerald-500/10', dotCls: 'bg-emerald-500' },
    low_stock:    { labelKey: 'dashboard.low_stock', defaultLabel: 'Low Stock', textCls: 'text-amber-600 dark:text-amber-400', bgCls: 'bg-amber-500/10', dotCls: 'bg-amber-500' },
    out_of_stock: { labelKey: 'dashboard.out_of_stock', defaultLabel: 'Out of Stock', textCls: 'text-rose-600 dark:text-rose-400', bgCls: 'bg-rose-500/10', dotCls: 'bg-rose-500' },
    negative:     { labelKey: 'reports.negative_stock', defaultLabel: 'Negative', textCls: 'text-red-600 dark:text-red-400', bgCls: 'bg-red-500/10', dotCls: 'bg-red-500' },
  };
  const cfg = statusCfgMap[status] || statusCfgMap.in_stock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${cfg.bgCls} ${cfg.textCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotCls}`} />
      {t(cfg.labelKey, cfg.defaultLabel)}
    </span>
  );
}

function SectionCard({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h3 className="text-sm font-black text-foreground tracking-tight">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">{children}</th>
);

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function SalesBarChart({ data = [] }: { data: SalesReportItem[] }) {
  const { t } = useLanguage();
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-xs font-bold text-foreground/45">
        {t('reports.no_orders_range', 'No sales data available for this range')}
      </div>
    );
  }
  
  const maxSale = Math.max(...data.map(d => d.total_sales));
  const MAX_V = maxSale > 0 ? Math.ceil(maxSale / 500) * 500 : 500;
  const BAR_W = 52, GAP = 26, L = 58, R = 16, CH = 180, CB = 215, CT = CB - CH;
  const VW    = L + data.length * BAR_W + (data.length - 1) * GAP + R;
  const VH    = CB + 38;
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((MAX_V / 5) * i));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[580px]">
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" className="overflow-visible">
          <defs>
            <linearGradient id="rpt-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Grid + Y labels */}
          {ticks.map(t => {
            const y = CB - (t / MAX_V) * CH;
            return (
              <g key={t}>
                <line x1={L} y1={y} x2={VW - R} y2={y} stroke="currentColor" strokeWidth="1" className="text-foreground/10" />
                <text x={L - 8} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-foreground/40 select-none">
                  {t === 0 ? '$0' : `$${(t / 1000).toFixed(1)}K`}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const x = L + i * (BAR_W + GAP);
            const h = (d.total_sales / MAX_V) * CH;
            const y = CB - h;
            return (
              <g key={d.date}>
                <rect x={x} y={CT} width={BAR_W} height={CH} rx="8" fill="currentColor" className="text-secondary/20" />
                <rect x={x} y={y}  width={BAR_W} height={h}  rx="8" fill="url(#rpt-bar-grad)" />
                <text x={x + BAR_W / 2} y={y - 6} textAnchor="middle" className="text-[9px] font-black fill-emerald-500 select-none">
                  ${(d.total_sales / 1000).toFixed(1)}K
                </text>
                <text x={x + BAR_W / 2} y={CB + 22} textAnchor="middle" className="text-[10px] font-bold fill-foreground/40 select-none">
                  {fmtShort(d.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const ic = (path: string) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);
const DollarIcon   = () => ic('M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
const CartIcon     = () => ic('M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z');
const CashIcon     = () => ic('M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z');
const BarIcon      = () => ic('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z');
const TrendIcon    = () => ic('M13 7h8m0 0v8m0-8l-8 8-4-4-6 6');
const BoxIcon      = () => ic('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4');
const WarningIcon  = () => ic('M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z');
const BanIcon      = () => ic('M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636');
const AlertIcon    = () => ic('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9');

// ─── Daily Tab ─────────────────────────────────────────────────────────────────
interface DailyTabProps {
  date: string;
  setDate: (d: string) => void;
}

function DailyTab({ date, setDate }: DailyTabProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reportService.getDailyReport(date);
      setData(res);
    } catch (err) {
      console.error('Daily report fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 select-none">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-bold text-foreground/50 tracking-wider">{t('reports.generating', 'Generating Daily Report...')}</span>
      </div>
    );
  }

  const d = data || {
    total_sales: 0,
    total_orders: 0,
    total_shifts: 0,
    average_order_value: 0,
    shifts_breakdown: [],
    top_products: [],
    low_stock_items: [],
    summary: { total_products_sold: 0, cash_collected: 0, short_over_amount: 0 },
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap select-none bg-card p-4 rounded-2xl border border-border/40">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{t('reports.date', 'Date')}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3.5 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer min-h-[42px]" />
        </div>
        <div className="flex items-end pb-0.5">
          <button onClick={fetchReport} disabled={isLoading}
            className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 min-h-[42px]">
            {isLoading ? t('reports.generating', 'Generating...') : t('reports.generate', 'Generate')}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('reports.total_sales', 'Total Sales')}     value={fmtUSD(d.total_sales)}           sub={`${d.total_orders} ${t('reports.orders', 'orders')}`}              accent="emerald" icon={<DollarIcon />} />
        <StatCard label={t('reports.total_orders', 'Total Orders')}    value={String(d.total_orders)}            sub={t('reports.pos_transactions', 'POS transactions')}                        accent="indigo"  icon={<CartIcon />}   />
        <StatCard label={t('reports.cash_collected', 'Cash Collected')}  value={fmtUSD(d.summary.cash_collected)} sub={t('reports.drawer_total', 'Drawer total')}                            accent="sky"     icon={<CashIcon />}   />
        <StatCard label={t('reports.avg_order_value', 'Avg Order Value')} value={fmtUSD(d.average_order_value)}    sub={`${d.summary.total_products_sold} ${t('reports.items_sold', 'items sold')}`} accent="amber" icon={<BarIcon />} />
      </div>

      {/* Top Products */}
      <SectionCard title={t('reports.top_selling_products', 'Top Selling Products')}>
        {d.top_products.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-foreground/45 bg-secondary/5 border-t border-border/30">
            {t('reports.no_sales_date', 'No sales recorded for this date.')}
          </div>
        ) : (
          <div className="overflow-x-auto w-full rounded-2xl border border-border/30 bg-secondary/5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-secondary/35 border-b border-border/30">
                  <TH>#</TH>
                  <TH>{t('dashboard.col_name', 'Product')}</TH>
                  <TH>Code</TH>
                  <TH>Qty Sold</TH>
                  <TH>Revenue</TH>
                  <TH>Avg Price</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {d.top_products.map((p: any, i: number) => (
                  <tr key={p.product_id} className="hover:bg-secondary/15 transition-colors duration-150">
                    <td className="px-5 py-4 text-foreground/40 font-bold text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-5 py-4 font-black text-foreground">
                      {p.product_name}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-foreground/50">
                      {p.product_code}
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">
                      {p.quantity_sold}
                    </td>
                    <td className="px-5 py-4 font-black text-emerald-500">
                      {fmtUSD(p.revenue)}
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground/70">
                      {fmtUSD(p.average_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Shifts + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title={t('reports.cashier_sales_summary', 'Cashier Sales Summary')}>
          {d.shifts_breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-foreground/45 bg-secondary/5 border-t border-border/30">
              {t('reports.no_cashier_orders', 'No cashier orders recorded for this date.')}
            </div>
          ) : (
            <div className="overflow-x-auto w-full rounded-2xl border border-border/30 bg-secondary/5">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary/35 border-b border-border/30">
                    <TH>Cashier</TH>
                    <TH>Orders</TH>
                    <TH>Sales</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {d.shifts_breakdown.map((s: any) => {
                    const initials = s.seller_name.trim().split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={s.seller_id} className="hover:bg-secondary/15 transition-colors duration-150">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-xs font-black select-none border border-indigo-500/10 shrink-0">
                              {initials || '??'}
                            </div>
                            <span className="text-sm font-black text-foreground">{s.seller_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-foreground/80">
                          {s.total_orders}
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-500">
                          {fmtUSD(s.total_sales)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="+s">
          {d.low_stock_items.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-foreground/45 bg-secondary/5 border-t border-border/30">
              All active product inventory stocks are healthy.
            </div>
          ) : (
            <div className="divide-y divide-border/20 rounded-2xl border border-border/30 bg-secondary/5 overflow-hidden">
              {d.low_stock_items.map((item: any) => (
                <div key={item.product_id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-secondary/15 transition-colors duration-150">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{item.product_name}</p>
                    <p className="text-[10px] font-bold text-foreground/40 font-mono mt-0.5">{item.product_code}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{item.current_stock}</p>
                      <p className="text-[9px] text-foreground/40 font-bold mt-0.5">/ {item.low_stock_threshold} min</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Sales History Tab ──────────────────────────────────────────────────────────
interface SalesHistoryTabProps {
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
}

function SalesHistoryTab({ startDate, setStartDate, endDate, setEndDate }: SalesHistoryTabProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reportService.getSalesHistoryReport({
        start_date: startDate,
        end_date: endDate,
        limit: 100,
      });
      setData(res);
    } catch (err) {
      console.error('Sales history report fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 select-none">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-bold text-foreground/50 tracking-wider">{t('reports.loading', 'Loading...')}</span>
      </div>
    );
  }

  const s = data || {
    sales: [],
    summary: { total_sales: 0, total_orders: 0, average_daily_sales: 0 },
  };

  return (
    <div className="space-y-5">
      {/* Date range */}
      <div className="flex items-end gap-3 flex-wrap select-none bg-card p-4 rounded-2xl border border-border/40">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{t('reports.from', 'From')}</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-3.5 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer min-h-[42px]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{t('reports.to', 'To')}</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-3.5 py-2.5 bg-secondary/20 border border-border/50 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer min-h-[42px]" />
        </div>
        <div>
          <button onClick={fetchReport} disabled={isLoading}
            className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 min-h-[42px]">
            {isLoading ? t('reports.loading', 'Loading...') : t('reports.apply', 'Apply')}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('reports.total_revenue', 'Total Revenue')}     value={fmtUSD(s.summary.total_sales)}        sub={t('reports.in_selected_range', 'In selected range')} accent="emerald" icon={<DollarIcon />} />
        <StatCard label={t('reports.total_orders', 'Total Orders')}      value={String(s.summary.total_orders)}         sub={t('reports.total_transactions', 'Total transactions')}        accent="indigo"  icon={<CartIcon />}   />
        <StatCard label={t('reports.avg_daily_revenue', 'Avg Daily Revenue')} value={fmtUSD(s.summary.average_daily_sales)} sub={t('reports.per_trading_day', 'Per trading day')}   accent="sky"     icon={<BarIcon />}    />
      </div>

      {/* Bar chart */}
      <SectionCard title={t('reports.daily_revenue', 'Daily Revenue')}>
        <div className="p-5 pt-4">
          <SalesBarChart data={s.sales} />
        </div>
      </SectionCard>

      {/* Daily table */}
      <SectionCard title={t('reports.day_by_day_summary', 'Day-by-Day Summary')}>
        {s.sales.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-foreground/45 bg-secondary/5 border-t border-border/30">
            {t('reports.no_orders_range', 'No orders found within this date range.')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/20 border-b border-border/30">
                <TH>{t('reports.date', 'Date')}</TH><TH>{t('reports.orders', 'Orders')}</TH><TH>{t('reports.total_revenue', 'Revenue')}</TH>
              </tr>
            </thead>
            <tbody>
              {s.sales.map((item: any) => (
                <tr key={item.date} className="border-b border-border/20 hover:bg-secondary/20 transition-colors last:border-0">
                  <td className="px-5 py-4 font-black text-foreground">{fmtFull(item.date)}</td>
                  <td className="px-5 py-4 font-bold text-foreground/70">{item.total_orders}</td>
                  <td className="px-5 py-4 font-black text-emerald-500">{fmtUSD(item.total_sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Income Report Tab ──────────────────────────────────────────────────────────
interface IncomeTabProps {
  period: Period;
  setPeriod: (p: Period) => void;
}

function IncomeTab({ period, setPeriod }: IncomeTabProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reportService.getIncomeReport(period);
      setData(res);
    } catch (err) {
      console.error('Income report fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 select-none">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-bold text-foreground/50 tracking-wider">{t('reports.loading', 'Calculating Income Report...')}</span>
      </div>
    );
  }

  const inc    = data || {
    total_sales: 0,
    total_orders: 0,
    totalItems: 0,
    cogs: 0,
    profit: 0,
    purchasesCost: 0,
    purchasesQty: 0,
  };
  const margin = inc.total_sales > 0 ? Math.round((inc.profit / inc.total_sales) * 100) : 0;
  const cogsPct = inc.total_sales > 0 ? Math.round((inc.cogs / inc.total_sales) * 100) : 0;

  const periods: { id: Period; label: string }[] = [
    { id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-2xl w-fit select-none">
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
              period === p.id ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('reports.total_revenue', 'Total Revenue')}   value={fmtUSD(inc.total_sales)}    sub={`${inc.total_orders} ${t('reports.orders', 'orders')}`}        accent="emerald" icon={<DollarIcon />} />
        <StatCard label={t('reports.cogs', 'COGS')}            value={fmtUSD(inc.cogs)}            sub="Cost of goods sold"                  accent="rose"    icon={<BarIcon />}    />
        <StatCard label={t('reports.gross_profit', 'Gross Profit')}    value={fmtUSD(inc.profit)}          sub={`${margin}% margin`}                 accent="indigo"  icon={<TrendIcon />}  />
        <StatCard label={t('reports.purchases_cost', 'Purchases Cost')}  value={fmtUSD(inc.purchasesCost)}   sub={`${inc.purchasesQty} units bought`}  accent="amber"   icon={<BoxIcon />}    />
      </div>

      {/* Profit Margin visual */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-foreground">{t('reports.profit_margin', 'Profit Margin')}</h3>
            <p className="text-[10px] text-foreground/45 font-bold uppercase tracking-widest mt-0.5">{t('reports.revenue_breakdown', 'Revenue breakdown')}</p>
          </div>
          <span className="text-3xl font-black text-indigo-500">{margin}%</span>
        </div>

        {/* Stacked bar */}
        <div className="w-full h-5 bg-secondary/30 rounded-full overflow-hidden flex">
          <div className="h-full bg-indigo-500 rounded-l-full transition-all duration-700" style={{ width: `${margin}%` }} />
          <div className="h-full bg-rose-500/60 transition-all duration-700" style={{ width: `${cogsPct}%` }} />
        </div>

        <div className="flex gap-6 flex-wrap select-none">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
            {t('reports.gross_profit', 'Gross Profit')} ({margin}%) — {fmtUSD(inc.profit)}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
            <div className="w-3 h-3 rounded-full bg-rose-500/60 shrink-0" />
            {t('reports.cogs', 'COGS')} ({cogsPct}%) — {fmtUSD(inc.cogs)}
          </div>
        </div>
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase font-black text-foreground/45 tracking-widest">{t('reports.total_items_sold', 'Total Items Sold')}</p>
          <p className="text-3xl font-black text-foreground mt-2">{inc.totalItems.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-foreground/35 mt-1">{period} period</p>
        </div>
        <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase font-black text-foreground/45 tracking-widest">{t('reports.purchases_qty', 'Purchases Qty')}</p>
          <p className="text-3xl font-black text-foreground mt-2">{inc.purchasesQty.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-foreground/35 mt-1">{t('reports.units_restocked', 'units restocked')}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Report Tab ───────────────────────────────────────────────────────────
interface StockReportTabProps {
  lowOnly: boolean;
  setLowOnly: (l: boolean) => void;
  search: string;
  setSearch: (s: string) => void;
}

function StockReportTab({ lowOnly, setLowOnly, search, setSearch }: StockReportTabProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reportService.getStockReport({
        low_stock_only: lowOnly ? true : undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Stock report fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lowOnly]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 select-none">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-bold text-foreground/50 tracking-wider">{t('reports.loading', 'Generating Stock Report...')}</span>
      </div>
    );
  }

  const d = data || {
    summary: { total_products: 0, low_stock_count: 0, out_of_stock_count: 0, negative_stock_count: 0 },
    stock_report: [],
  };

  const filtered = d.stock_report.filter((item: any) => {
    const q = search.toLowerCase();
    if (q && !item.product_name.toLowerCase().includes(q) && !(item.product_code || '').toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('reports.search_product_code', 'Search product or code…')}
          className="px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl text-sm font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-emerald-500/50 w-56" />
        <button onClick={() => setLowOnly(!lowOnly)}
          className={`px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
            lowOnly
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
              : 'bg-secondary/40 text-foreground/60 border-border/40 hover:border-border/80'
          }`}>
          {lowOnly ? t('reports.low_out_only', '⚠ Low / Out Only') : t('reports.show_all', 'Show All')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('reports.total_products', 'Total Products')}  value={String(d.summary.total_products)}       sub={t('reports.in_inventory', 'In inventory')}    accent="sky"     icon={<BoxIcon />}     />
        <StatCard label={t('reports.low_stock', 'Low Stock')}        value={String(d.summary.low_stock_count)}       sub={t('reports.need_reorder', 'Need reorder')}    accent="amber"   icon={<WarningIcon />} />
        <StatCard label={t('reports.out_of_stock', 'Out of Stock')}     value={String(d.summary.out_of_stock_count)}    sub={t('reports.critical', 'Critical')}        accent="rose"    icon={<BanIcon />}     />
        <StatCard label={t('reports.negative_stock', 'Negative Stock')}   value={String(d.summary.negative_stock_count)}  sub={t('reports.check_movement', 'Check movement')}  accent="indigo"  icon={<AlertIcon />}   />
      </div>

      {/* Table */}
      <SectionCard title={`${t('reports.stock_inventory', 'Stock Inventory')} (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-foreground/45 bg-secondary/5 border-t border-border/30">
            {t('reports.no_products_filter', 'No products found matching active filters.')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/20 border-b border-border/30">
                <TH>{t('dashboard.col_name', 'Product')}</TH><TH>Code</TH><TH>{t('products.col_category', 'Category')}</TH><TH>{t('stock.current_stock', 'Current Stock')}</TH><TH>{t('stock.low_stock_threshold', 'Min Threshold')}</TH><TH>{t('products.col_status', 'Status')}</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => (
                <tr key={item.product_id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors last:border-0">
                  <td className="px-5 py-3.5 font-bold text-foreground">{item.product_name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground/50">{item.product_code || 'N/A'}</td>
                  <td className="px-5 py-3.5 text-foreground/60 font-bold">{item.category || 'Uncategorized'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-base font-black ${
                      item.current_stock === 0            ? 'text-rose-500'
                      : item.current_stock <= (item.low_stock_threshold || 0) ? 'text-amber-500'
                      : 'text-foreground'
                    }`}>{item.current_stock}</span>
                  </td>
                  <td className="px-5 py-3.5 text-foreground/50 font-bold">{item.low_stock_threshold ?? 'N/A'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const { t } = useLanguage();
  const [activeTab,   setActiveTab]   = useState<TabId>('daily');
  const [showExport,  setShowExport]  = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Lifted Shared Filter States
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [salesStartDate, setSalesStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return d.toISOString().slice(0, 10);
  });
  const [salesEndDate, setSalesEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stockLowOnly, setStockLowOnly] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [incomePeriod, setIncomePeriod] = useState<Period>('monthly');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async (format: 'CSV' | 'XLSX' | 'PDF') => {
    setShowExport(false);
    try {
      setIsExporting(true);
      let report_type: 'daily_sales' | 'sales_history' | 'stock_summary';
      let exportParams: any = {};

      if (activeTab === 'daily') {
        report_type = 'daily_sales';
        exportParams = { date: dailyDate };
      } else if (activeTab === 'sales') {
        report_type = 'sales_history';
        exportParams = { start_date: salesStartDate, end_date: salesEndDate };
      } else if (activeTab === 'stock') {
        report_type = 'stock_summary';
        exportParams = { low_stock_only: stockLowOnly };
      } else {
        return;
      }

      const res = await reportService.exportReport({
        report_type,
        format,
        ...exportParams
      });

      if (res && res.file_url) {
        window.open(res.file_url, '_blank');
      }
    } catch (err: any) {
      console.error('Failed to export report:', err);
      alert(err.message || 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs: { id: TabId; labelKey: string; defaultLabel: string }[] = [
    { id: 'daily',  labelKey: 'reports.tab_daily',  defaultLabel: 'Daily Report'  },
    { id: 'sales',  labelKey: 'reports.tab_sales',  defaultLabel: 'Sales History' },
    { id: 'income', labelKey: 'reports.tab_income', defaultLabel: 'Income Report' },
    { id: 'stock',  labelKey: 'reports.tab_stock',  defaultLabel: 'Stock Report'  },
  ];

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-2xl select-none">
          {tabs.map(tItem => (
            <button key={tItem.id} onClick={() => setActiveTab(tItem.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                activeTab === tItem.id ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
              }`}>
              {t(tItem.labelKey, tItem.defaultLabel)}
            </button>
          ))}
        </div>

        {/* Export dropdown */}
        {activeTab !== 'income' && (
          <div className="relative" ref={exportRef}>
            <button onClick={() => setShowExport(!showExport)} disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground text-xs font-black transition-all cursor-pointer disabled:opacity-50">
              {isExporting ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('reports.exporting', 'Exporting...')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('reports.export', 'Export')}
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showExport ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden z-20">
                {['CSV', 'XLSX', 'PDF'].map(fmt => (
                  <button key={fmt} onClick={() => handleExport(fmt as any)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-foreground/70 hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      fmt === 'CSV' ? 'bg-emerald-500' : fmt === 'XLSX' ? 'bg-indigo-500' : 'bg-rose-500'
                    }`} />
                    Export as {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'daily'  && <DailyTab date={dailyDate} setDate={setDailyDate} />}
      {activeTab === 'sales'  && <SalesHistoryTab startDate={salesStartDate} setStartDate={setSalesStartDate} endDate={salesEndDate} setEndDate={setSalesEndDate} />}
      {activeTab === 'income' && <IncomeTab period={incomePeriod} setPeriod={setIncomePeriod} />}
      {activeTab === 'stock'  && <StockReportTab lowOnly={stockLowOnly} setLowOnly={setStockLowOnly} search={stockSearch} setSearch={setStockSearch} />}
    </div>
  );
}
