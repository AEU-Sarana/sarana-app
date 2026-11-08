'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { reportService, ProfitLossPeriod, ProfitLossReportResponse } from '../../../services/reportService';
import { useLanguage } from '../../../contexts/language-context';
import { useAuth } from '../../../hooks/useAuth';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TabId       = 'daily' | 'income' | 'profit_loss';
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'negative';
type Period      = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface TopProduct    { product_id: number; product_name: string; product_code: string; quantity_sold: number; revenue: number; average_price: number; }
interface ShiftRow      { seller_id: number; seller_name: string; shift_count: number; total_sales: number; total_orders: number; start_time: string; end_time: string; }

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
const ShieldIcon   = () => ic('M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z');
const PrintIcon    = () => ic('M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z');

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

        <SectionCard title={t('reports.low_stock_alerts', 'Low Stock Alerts')}>
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

// ─── Profit & Loss (P&L) Tab (Administrator) ───────────────────────────────────
function ProfitLossTab() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<ProfitLossPeriod>('monthly');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [comparePrevious, setComparePrevious] = useState(true);
  const [data, setData] = useState<ProfitLossReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportService.getProfitLossReport({
        period,
        start_date: period === 'custom' ? customStart : undefined,
        end_date: period === 'custom' ? customEnd : undefined,
        compare_previous: comparePrevious,
      });
      if (res) setData(res);
    } catch (err: any) {
      console.error('Profit & Loss fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, customStart, customEnd, comparePrevious]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const periods: { id: ProfitLossPeriod; labelKey: string; defaultLabel: string }[] = [
    { id: 'daily',   labelKey: 'reports.period_daily',   defaultLabel: 'Daily'   },
    { id: 'weekly',  labelKey: 'reports.period_weekly',  defaultLabel: 'Weekly'  },
    { id: 'monthly', labelKey: 'reports.period_monthly', defaultLabel: 'Monthly' },
    { id: 'yearly',  labelKey: 'reports.period_yearly',  defaultLabel: 'Yearly'  },
    { id: 'custom',  labelKey: 'reports.period_custom',  defaultLabel: 'Custom'  },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    const s = data.summary;
    const rows = [
      ['PHARMACY FINANCIAL STATEMENT - PROFIT & LOSS (P&L)'],
      ['Period', data.period.toUpperCase()],
      ['Date Range', `${data.date_range.start.slice(0, 10)} to ${data.date_range.end.slice(0, 10)}`],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['1. FINANCIAL METRICS SUMMARY', 'AMOUNT (USD)'],
      ['Gross Sales Revenue', s.gross_sales.toFixed(2)],
      ['Sales Discounts Deduction', `-${s.discounts.toFixed(2)}`],
      ['Net Sales Revenue', s.net_sales.toFixed(2)],
      ['Cost of Goods Sold (COGS)', `-${s.cogs.toFixed(2)}`],
      ['Gross Operating Profit', s.gross_profit.toFixed(2)],
      ['Gross Margin (%)', `${s.gross_margin_pct}%`],
      ['Stock Shrinkage Losses (Damage/Expired)', `-${s.stock_loss.toFixed(2)}`],
      ['Net Bottom-Line Profit / (Loss)', s.net_profit.toFixed(2)],
      ['Net Profit Margin (%)', `${s.net_margin_pct}%`],
      ['Total Completed Orders', s.total_orders],
      ['Total Medicine Units Sold', s.total_items_sold],
      [],
      ['2. CATEGORY PROFIT CONTRIBUTION', 'UNITS SOLD', 'REVENUE ($)', 'COGS ($)', 'GROSS PROFIT ($)', 'MARGIN (%)'],
      ...data.category_breakdown.map((c) => [
        `"${c.category_name.replace(/"/g, '""')}"`,
        c.quantity_sold,
        c.revenue.toFixed(2),
        c.cogs.toFixed(2),
        c.profit.toFixed(2),
        `${c.margin_pct}%`,
      ]),
      [],
      ['3. TOP PROFITABLE MEDICINES', 'PRODUCT CODE', 'CATEGORY', 'UNITS SOLD', 'REVENUE ($)', 'COGS ($)', 'PROFIT ($)', 'MARGIN (%)'],
      ...data.top_profitable_products.map((p) => [
        `"${p.product_name.replace(/"/g, '""')}"`,
        p.product_code,
        `"${p.category_name.replace(/"/g, '""')}"`,
        p.quantity_sold,
        p.revenue.toFixed(2),
        p.cogs.toFixed(2),
        p.profit.toFixed(2),
        `${p.margin_pct}%`,
      ]),
      [],
      ['4. DAMAGED & EXPIRED STOCK WRITE-OFFS', 'DATE', 'REASON / MOVEMENT', 'QUANTITY', 'COST LOSS ($)'],
      ...data.stock_loss_items.map((i) => [
        `"${i.product_name.replace(/"/g, '""')}"`,
        i.date.slice(0, 10),
        `"${i.movement_type.replace(/"/g, '""')}"`,
        i.quantity,
        i.cost_loss.toFixed(2),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Profit_Loss_Statement_${data.period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const s = data?.summary || {
    gross_sales: 0,
    discounts: 0,
    net_sales: 0,
    cogs: 0,
    gross_profit: 0,
    gross_margin_pct: 0,
    stock_loss: 0,
    net_profit: 0,
    net_margin_pct: 0,
    total_orders: 0,
    total_items_sold: 0,
  };

  const growth = data?.growth_comparison;
  const isProfitable = s.net_profit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Confidential Clearance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldIcon />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-foreground">
                {t('reports.profit_loss_title', 'Profit and Loss Statement (P&L)')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Administrator
              </span>
            </div>
            <p className="text-[11px] font-bold text-foreground/50 mt-0.5">
              {t('reports.profit_loss_subtitle', 'Comprehensive income statement, COGS, gross margin, stock write-offs, and net earnings')}
            </p>
          </div>
        </div>

        {/* Action buttons (Print & Export) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/70 hover:text-foreground text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <PrintIcon />
            {t('reports.print_statement', 'Print Statement')}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!data || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('reports.export_excel', 'Export P&L (CSV)')}
          </button>
        </div>
      </div>

      {/* Period & Filter Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border/40 rounded-3xl p-4 shadow-sm">
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-2xl select-none flex-wrap">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                period === p.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              {t(p.labelKey, p.defaultLabel)}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-secondary/40 border border-border/40 text-foreground text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary"
            />
            <span className="text-xs font-bold text-foreground/40">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-secondary/40 border border-border/40 text-foreground text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary"
            />
            <button
              onClick={fetchReport}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
            >
              {t('reports.apply', 'Apply')}
            </button>
          </div>
        )}

        {/* Compare Previous Checkbox */}
        <label className="flex items-center gap-2 text-xs font-bold text-foreground/60 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={comparePrevious}
            onChange={(e) => setComparePrevious(e.target.checked)}
            className="w-4 h-4 rounded border-border/40 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>{t('reports.growth_vs_previous', 'Compare with Previous Period')}</span>
        </label>
      </div>

      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4 select-none">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <span className="text-xs font-bold text-foreground/50 tracking-wider">
            {t('reports.loading', 'Calculating Profit & Loss Statement...')}
          </span>
        </div>
      ) : (
        <>
          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label={t('reports.net_sales', 'Net Revenue')}
              value={fmtUSD(s.net_sales)}
              sub={`Gross: ${fmtUSD(s.gross_sales)} • Disc: -${fmtUSD(s.discounts)}`}
              accent="emerald"
              icon={<DollarIcon />}
            />
            <StatCard
              label={t('reports.cogs', 'COGS')}
              value={fmtUSD(s.cogs)}
              sub={`${s.total_items_sold.toLocaleString()} units sold`}
              accent="rose"
              icon={<BarIcon />}
            />
            <StatCard
              label={t('reports.gross_profit_title', 'Gross Profit')}
              value={fmtUSD(s.gross_profit)}
              sub={`${s.gross_margin_pct}% margin`}
              accent="indigo"
              icon={<TrendIcon />}
            />
            <StatCard
              label={t('reports.inventory_loss', 'Stock Shrinkage')}
              value={`-${fmtUSD(s.stock_loss)}`}
              sub={`${data?.stock_loss_items?.length || 0} damage/expiry items`}
              accent="orange"
              icon={<WarningIcon />}
            />
            <StatCard
              label={t('reports.net_profit', 'Net Profit')}
              value={fmtUSD(s.net_profit)}
              sub={`${s.net_margin_pct}% net margin`}
              accent={isProfitable ? 'emerald' : 'rose'}
              icon={<CashIcon />}
            />
          </div>

          {/* Growth Comparison Banner (if enabled) */}
          {growth && (
            <div className="flex items-center justify-between gap-4 bg-card border border-border/40 rounded-2xl p-4 shadow-sm text-xs font-bold text-foreground/70 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-foreground/40">
                  {t('reports.growth_vs_previous', 'vs Previous Period')}:
                </span>
                <span className={`inline-flex items-center gap-1 font-black ${growth.sales_growth_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {growth.sales_growth_pct >= 0 ? '▲' : '▼'} {Math.abs(growth.sales_growth_pct)}% Sales
                </span>
                <span className="text-foreground/20">•</span>
                <span className={`inline-flex items-center gap-1 font-black ${growth.profit_growth_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {growth.profit_growth_pct >= 0 ? '▲' : '▼'} {Math.abs(growth.profit_growth_pct)}% Net Profit
                </span>
              </div>
              <div className="text-[11px] text-foreground/40 font-semibold">
                Previous Net Sales: <span className="font-bold text-foreground/60">{fmtUSD(growth.previous_net_sales)}</span> | Previous Net Profit: <span className="font-bold text-foreground/60">{fmtUSD(growth.previous_net_profit)}</span>
              </div>
            </div>
          )}

          {/* Financial Statement Structured Waterfall Sheet */}
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight">
                  {t('reports.statement_heading', 'Income Statement Summary')}
                </h3>
                <p className="text-[10px] text-foreground/45 font-bold uppercase tracking-widest mt-0.5">
                  Accounting Waterfall (Revenue → Costs → Gross Profit → Losses → Net Profit)
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isProfitable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isProfitable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isProfitable ? 'Net Profitable' : 'Net Deficit / Loss'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              {/* 1. Operating Revenue */}
              <div className="p-3 bg-secondary/15 rounded-xl flex items-center justify-between font-black text-foreground">
                <span>{t('reports.operating_revenue', '1. Operating Revenue')}</span>
                <span>{fmtUSD(s.net_sales)}</span>
              </div>
              <div className="pl-6 pr-4 py-2 flex items-center justify-between text-foreground/60 font-semibold border-b border-border/10">
                <span>Gross Pharmacy Sales (before discounts)</span>
                <span className="font-bold text-foreground">{fmtUSD(s.gross_sales)}</span>
              </div>
              <div className="pl-6 pr-4 py-2 flex items-center justify-between text-foreground/60 font-semibold border-b border-border/10">
                <span>Less: Customer Discounts Deductions</span>
                <span className="font-bold text-rose-500">-{fmtUSD(s.discounts)}</span>
              </div>
              <div className="pl-6 pr-4 py-2 flex items-center justify-between font-bold text-foreground bg-secondary/10 rounded-lg">
                <span>Total Net Sales Revenue (100.0%)</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{fmtUSD(s.net_sales)}</span>
              </div>

              {/* 2. Direct Cost of Goods Sold */}
              <div className="p-3 bg-secondary/15 rounded-xl flex items-center justify-between font-black text-foreground mt-3">
                <span>{t('reports.direct_costs', '2. Cost of Sales (COGS)')}</span>
                <span className="text-rose-500">-{fmtUSD(s.cogs)}</span>
              </div>
              <div className="pl-6 pr-4 py-2 flex items-center justify-between text-foreground/60 font-semibold border-b border-border/10">
                <span>Cost of Medicine Stock Sold at Sale ({s.total_items_sold.toLocaleString()} items)</span>
                <span className="font-bold text-rose-500">-{fmtUSD(s.cogs)}</span>
              </div>
              <div className="pl-6 pr-4 py-2 flex items-center justify-between font-bold text-foreground bg-secondary/10 rounded-lg">
                <span>Gross Operating Profit (Gross Margin: {s.gross_margin_pct}%)</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{fmtUSD(s.gross_profit)}</span>
              </div>

              {/* 3. Operating & Inventory Shrinkage Losses */}
              <div className="p-3 bg-secondary/15 rounded-xl flex items-center justify-between font-black text-foreground mt-3">
                <span>{t('reports.operating_expenses', '3. Shrinkage & Inventory Losses')}</span>
                <span className="text-orange-500">-{fmtUSD(s.stock_loss)}</span>
              </div>
              <div className="pl-6 pr-4 py-2 flex items-center justify-between text-foreground/60 font-semibold border-b border-border/10">
                <span>Damaged & Expired Medicine Stock Write-offs ({data?.stock_loss_items?.length || 0} batches)</span>
                <span className="font-bold text-orange-500">-{fmtUSD(s.stock_loss)}</span>
              </div>

              {/* 4. Bottom Line Net Earnings */}
              <div className={`p-4 rounded-2xl flex items-center justify-between mt-4 text-sm font-black shadow-sm ${
                isProfitable
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}>
                <div>
                  <p className="text-xs uppercase tracking-widest text-foreground/50 font-black">
                    {t('reports.net_earnings', '4. Net Profit / (Loss)')}
                  </p>
                  <p className="text-base font-black mt-0.5">
                    {isProfitable ? 'Net Bottom-Line Profit' : 'Net Bottom-Line Deficit'} ({s.net_margin_pct}% Net Margin)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{fmtUSD(s.net_profit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Grid: Category Contribution & Top Profitable Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Table */}
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight">
                  {t('reports.category_contribution', 'Profit Contribution by Category')}
                </h3>
                <p className="text-[10px] text-foreground/45 font-bold uppercase tracking-widest mt-0.5">
                  Category Profit & Margin Performance
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] font-black text-foreground/45 uppercase tracking-wider">
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5 text-right">Sold</th>
                      <th className="py-2.5 text-right">Revenue</th>
                      <th className="py-2.5 text-right">Profit</th>
                      <th className="py-2.5 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 text-xs">
                    {data?.category_breakdown && data.category_breakdown.length > 0 ? (
                      data.category_breakdown.map((cat) => (
                        <tr key={cat.category_id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 font-bold text-foreground">
                            {cat.category_name}
                          </td>
                          <td className="py-3 text-right font-semibold text-foreground/60">
                            {cat.quantity_sold.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-semibold text-foreground/70">
                            {fmtUSD(cat.revenue)}
                          </td>
                          <td className="py-3 text-right font-black text-indigo-500">
                            {fmtUSD(cat.profit)}
                          </td>
                          <td className="py-3 text-right font-bold text-foreground/50">
                            <span className="px-2 py-0.5 bg-secondary/50 rounded-md text-[10px] font-black">
                              {cat.margin_pct}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs font-bold text-foreground/40 italic">
                          No category sales recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Profitable Medicines Table */}
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight">
                  {t('reports.top_profitable_title', 'Top Profitable Medicines')}
                </h3>
                <p className="text-[10px] text-foreground/45 font-bold uppercase tracking-widest mt-0.5">
                  Medicines Driving Highest Bottom-Line Margins
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] font-black text-foreground/45 uppercase tracking-wider">
                      <th className="py-2.5">Medicine</th>
                      <th className="py-2.5 text-right">Qty</th>
                      <th className="py-2.5 text-right">Revenue</th>
                      <th className="py-2.5 text-right">Profit</th>
                      <th className="py-2.5 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 text-xs">
                    {data?.top_profitable_products && data.top_profitable_products.length > 0 ? (
                      data.top_profitable_products.map((prod) => (
                        <tr key={prod.product_id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 font-bold text-foreground">
                            <div>{prod.product_name}</div>
                            {prod.product_code && (
                              <div className="text-[10px] font-bold text-foreground/40">{prod.product_code}</div>
                            )}
                          </td>
                          <td className="py-3 text-right font-semibold text-foreground/60">
                            {prod.quantity_sold.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-semibold text-foreground/70">
                            {fmtUSD(prod.revenue)}
                          </td>
                          <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                            {fmtUSD(prod.profit)}
                          </td>
                          <td className="py-3 text-right font-bold text-foreground/50">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-black">
                              {prod.margin_pct}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs font-bold text-foreground/40 italic">
                          No product sales recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Damaged & Expired Stock Write-offs Table */}
          {data?.stock_loss_items && data.stock_loss_items.length > 0 && (
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-foreground tracking-tight">
                    {t('reports.stock_loss_title', 'Damaged & Expired Stock Write-offs')}
                  </h3>
                  <p className="text-[10px] text-foreground/45 font-bold uppercase tracking-widest mt-0.5">
                    Inventory Shrinkage Impacting Net Profitability
                  </p>
                </div>
                <span className="text-xs font-black text-orange-500">
                  Total Shrinkage: -{fmtUSD(s.stock_loss)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] font-black text-foreground/45 uppercase tracking-wider">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Medicine</th>
                      <th className="py-2.5">Write-off Reason</th>
                      <th className="py-2.5 text-right">Quantity</th>
                      <th className="py-2.5 text-right">Cost Loss ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 text-xs">
                    {data.stock_loss_items.map((loss) => (
                      <tr key={loss.movement_id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 font-bold text-foreground/50 text-[11px]">
                          {loss.date.slice(0, 10)}
                        </td>
                        <td className="py-3 font-bold text-foreground">
                          {loss.product_name}
                        </td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                            {loss.movement_type}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-foreground">
                          {loss.quantity}
                        </td>
                        <td className="py-3 text-right font-black text-rose-500">
                          -{fmtUSD(loss.cost_loss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ReportsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams?.get('tab') as TabId | null;
  const { user: authUser } = useAuth();
  const isAdministrator = authUser?.role?.toUpperCase() === 'ADMINISTRATOR' || authUser?.role?.toUpperCase() === 'SUPER_ADMIN';
  const isAdmin = isAdministrator || authUser?.role?.toUpperCase() === 'ADMIN';

  const [activeTab,   setActiveTab]   = useState<TabId>(() => {
    if (tabFromQuery && ['daily', 'income', 'profit_loss'].includes(tabFromQuery)) {
      return tabFromQuery;
    }
    return 'daily';
  });

  useEffect(() => {
    if (tabFromQuery && ['daily', 'income', 'profit_loss'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const [showExport,  setShowExport]  = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Lifted Shared Filter States
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().slice(0, 10));
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
      if (activeTab !== 'daily') return;

      const res = await reportService.exportReport({
        report_type: 'daily_sales',
        format,
        date: dailyDate,
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
    { id: 'income', labelKey: 'reports.tab_income', defaultLabel: 'Income Report' },
    ...(isAdmin ? [{ id: 'profit_loss' as TabId, labelKey: 'reports.tab_profit_loss', defaultLabel: 'Profit & Loss (P&L)' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-2xl select-none flex-wrap">
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
        {activeTab !== 'income' && activeTab !== 'profit_loss' && (
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
      {activeTab === 'daily'       && <DailyTab date={dailyDate} setDate={setDailyDate} />}
      {activeTab === 'income'      && <IncomeTab period={incomePeriod} setPeriod={setIncomePeriod} />}
      {activeTab === 'profit_loss' && <ProfitLossTab />}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] select-none">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
