'use client';

import React, { useState, useRef, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TabId       = 'daily' | 'sales' | 'income' | 'stock';
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'negative';
type Period      = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface TopProduct    { product_id: number; product_name: string; product_code: string; quantity_sold: number; revenue: number; average_price: number; }
interface ShiftRow      { seller_id: number; seller_name: string; shift_count: number; total_sales: number; total_orders: number; start_time: string; end_time: string; }
interface LowStockItem  { product_id: number; product_name: string; product_code: string; current_stock: number; low_stock_threshold: number; status: StockStatus; }
interface SalesDay      { date: string; total_sales: number; total_orders: number; total_shifts: number; }
interface StockItem     { product_id: number; product_name: string; product_code: string; category: string; current_stock: number; low_stock_threshold: number; status: StockStatus; }

// ─── Mock Data (matches real API shapes) ───────────────────────────────────────
const MOCK_DAILY = {
  total_sales: 1420.5, total_orders: 38, total_shifts: 2, average_order_value: 37.38,
  summary: { total_products_sold: 112, cash_collected: 1420.5, short_over_amount: 0 },
  shifts_breakdown: [
    { seller_id: 1, seller_name: 'Admin User', shift_count: 1, total_sales: 820.00, total_orders: 22, start_time: '08:00', end_time: '14:00' },
    { seller_id: 2, seller_name: 'Cashier A',  shift_count: 1, total_sales: 600.50, total_orders: 16, start_time: '14:00', end_time: '20:00' },
  ] as ShiftRow[],
  top_products: [
    { product_id: 1, product_name: 'Paracetamol 500mg',  product_code: 'PCM500', quantity_sold: 25, revenue: 187.5,  average_price: 7.5  },
    { product_id: 2, product_name: 'Amoxicillin 250mg',  product_code: 'AMX250', quantity_sold: 18, revenue: 216.0,  average_price: 12.0 },
    { product_id: 3, product_name: 'Vitamin C 1000mg',   product_code: 'VTC100', quantity_sold: 15, revenue: 112.5,  average_price: 7.5  },
    { product_id: 4, product_name: 'Ibuprofen 400mg',    product_code: 'IBU400', quantity_sold: 12, revenue: 96.0,   average_price: 8.0  },
    { product_id: 5, product_name: 'Omeprazole 20mg',    product_code: 'OMP020', quantity_sold: 10, revenue: 150.0,  average_price: 15.0 },
  ] as TopProduct[],
  low_stock_items: [
    { product_id: 10, product_name: 'Metformin 500mg',    product_code: 'MET500', current_stock: 5, low_stock_threshold: 20, status: 'low_stock'    as StockStatus },
    { product_id: 11, product_name: 'Aspirin 100mg',       product_code: 'ASP100', current_stock: 0, low_stock_threshold: 15, status: 'out_of_stock'  as StockStatus },
    { product_id: 12, product_name: 'Chlorphenamine 4mg', product_code: 'CHP004', current_stock: 3, low_stock_threshold: 10, status: 'low_stock'    as StockStatus },
  ] as LowStockItem[],
};

const MOCK_SALES = {
  summary: { total_sales: 18420, total_orders: 487, average_daily_sales: 1842 },
  sales: [
    { date: '2026-05-22', total_sales: 1200, total_orders: 32, total_shifts: 2 },
    { date: '2026-05-23', total_sales: 1580, total_orders: 41, total_shifts: 2 },
    { date: '2026-05-24', total_sales: 940,  total_orders: 25, total_shifts: 1 },
    { date: '2026-05-25', total_sales: 2100, total_orders: 56, total_shifts: 3 },
    { date: '2026-05-26', total_sales: 1750, total_orders: 48, total_shifts: 2 },
    { date: '2026-05-27', total_sales: 1320, total_orders: 35, total_shifts: 2 },
    { date: '2026-05-28', total_sales: 1900, total_orders: 52, total_shifts: 2 },
    { date: '2026-05-29', total_sales: 1680, total_orders: 45, total_shifts: 2 },
    { date: '2026-05-30', total_sales: 2230, total_orders: 61, total_shifts: 3 },
    { date: '2026-05-31', total_sales: 1420, total_orders: 38, total_shifts: 2 },
  ] as SalesDay[],
};

const MOCK_INCOME = {
  total_sales: 18420, total_orders: 487, totalItems: 1423,
  cogs: 9800, profit: 8620, purchasesCost: 11200, purchasesQty: 850,
};

const MOCK_STOCK = {
  summary: { total_products: 46, low_stock_count: 3, out_of_stock_count: 1, negative_stock_count: 0 },
  items: [
    { product_id: 1, product_name: 'Paracetamol 500mg',  product_code: 'PCM500', category: 'Analgesics',  current_stock: 150, low_stock_threshold: 20, status: 'in_stock'    as StockStatus },
    { product_id: 2, product_name: 'Amoxicillin 250mg',  product_code: 'AMX250', category: 'Antibiotics', current_stock: 89,  low_stock_threshold: 15, status: 'in_stock'    as StockStatus },
    { product_id: 3, product_name: 'Vitamin C 1000mg',   product_code: 'VTC100', category: 'Vitamins',    current_stock: 12,  low_stock_threshold: 20, status: 'low_stock'   as StockStatus },
    { product_id: 4, product_name: 'Ibuprofen 400mg',    product_code: 'IBU400', category: 'Analgesics',  current_stock: 0,   low_stock_threshold: 10, status: 'out_of_stock' as StockStatus },
    { product_id: 5, product_name: 'Metformin 500mg',    product_code: 'MET500', category: 'Diabetes',    current_stock: 5,   low_stock_threshold: 20, status: 'low_stock'   as StockStatus },
    { product_id: 6, product_name: 'Omeprazole 20mg',    product_code: 'OMP020', category: 'Gastro',      current_stock: 67,  low_stock_threshold: 10, status: 'in_stock'    as StockStatus },
    { product_id: 7, product_name: 'Cetirizine 10mg',    product_code: 'CTZ010', category: 'Allergy',     current_stock: 45,  low_stock_threshold: 10, status: 'in_stock'    as StockStatus },
  ] as StockItem[],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtUSD   = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtFull  = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const STATUS_CFG: Record<StockStatus, { label: string; textCls: string; bgCls: string; dotCls: string }> = {
  in_stock:     { label: 'In Stock',     textCls: 'text-emerald-600 dark:text-emerald-400', bgCls: 'bg-emerald-500/10', dotCls: 'bg-emerald-500' },
  low_stock:    { label: 'Low Stock',    textCls: 'text-amber-600 dark:text-amber-400',     bgCls: 'bg-amber-500/10',   dotCls: 'bg-amber-500'   },
  out_of_stock: { label: 'Out of Stock', textCls: 'text-rose-600 dark:text-rose-400',       bgCls: 'bg-rose-500/10',    dotCls: 'bg-rose-500'    },
  negative:     { label: 'Negative',     textCls: 'text-red-600 dark:text-red-400',         bgCls: 'bg-red-500/10',     dotCls: 'bg-red-500'     },
};

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
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${cfg.bgCls} ${cfg.textCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotCls}`} />
      {cfg.label}
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

// Table head helper
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">{children}</th>
);

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function SalesBarChart() {
  const data  = MOCK_SALES.sales;
  const MAX_V = 2500;
  const BAR_W = 52, GAP = 26, L = 58, R = 16, CH = 180, CB = 215, CT = CB - CH;
  const VW    = L + data.length * BAR_W + (data.length - 1) * GAP + R;
  const VH    = CB + 38;
  const ticks = [0, 500, 1000, 1500, 2000, 2500];

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
                  {t === 0 ? '$0' : `$${t / 1000}K`}
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
function DailyTab() {
  const [date, setDate] = useState('2026-05-31');
  const d = MOCK_DAILY;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-black text-foreground/50 uppercase tracking-widest">Date</span>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer" />
        <button className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl transition-all cursor-pointer">
          Generate
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sales"     value={fmtUSD(d.total_sales)}           sub={`${d.total_orders} orders`}              accent="emerald" icon={<DollarIcon />} />
        <StatCard label="Total Orders"    value={String(d.total_orders)}            sub="POS transactions"                        accent="indigo"  icon={<CartIcon />}   />
        <StatCard label="Cash Collected"  value={fmtUSD(d.summary.cash_collected)} sub="Drawer total"                            accent="sky"     icon={<CashIcon />}   />
        <StatCard label="Avg Order Value" value={fmtUSD(d.average_order_value)}    sub={`${d.summary.total_products_sold} items sold`} accent="amber" icon={<BarIcon />} />
      </div>

      {/* Top Products */}
      <SectionCard title="Top Selling Products">
        <div className="overflow-x-auto w-full rounded-2xl border border-border/30 bg-secondary/5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-secondary/35 border-b border-border/30">
                <TH>#</TH>
                <TH>Product</TH>
                <TH>Code</TH>
                <TH>Qty Sold</TH>
                <TH>Revenue</TH>
                <TH>Avg Price</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {d.top_products.map((p, i) => (
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
      </SectionCard>

      {/* Shifts + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Cashier Sales Summary">
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
                {d.shifts_breakdown
                  .filter(s => !s.seller_name.toLowerCase().includes('admin'))
                  .map((s) => {
                    const initials = s.seller_name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
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
        </SectionCard>

        <SectionCard title="Low Stock Alerts">
          <div className="divide-y divide-border/20 rounded-2xl border border-border/30 bg-secondary/5 overflow-hidden">
            {d.low_stock_items.map(item => (
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
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Sales History Tab ──────────────────────────────────────────────────────────
function SalesHistoryTab() {
  const [startDate, setStartDate] = useState('2026-05-22');
  const [endDate, setEndDate]     = useState('2026-05-31');
  const s = MOCK_SALES;

  return (
    <div className="space-y-5">
      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-black text-foreground/50 uppercase tracking-widest">From</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-emerald-500/50" />
        <span className="text-xs font-black text-foreground/50 uppercase tracking-widest">To</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-emerald-500/50" />
        <button className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl transition-all cursor-pointer">
          Apply
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue"     value={fmtUSD(s.summary.total_sales)}        sub="In selected range" accent="emerald" icon={<DollarIcon />} />
        <StatCard label="Total Orders"      value={String(s.summary.total_orders)}         sub="Total transactions"        accent="indigo"  icon={<CartIcon />}   />
        <StatCard label="Avg Daily Revenue" value={fmtUSD(s.summary.average_daily_sales)} sub="Per trading day"   accent="sky"     icon={<BarIcon />}    />
      </div>

      {/* Bar chart */}
      <SectionCard title="Daily Revenue">
        <div className="p-5 pt-4">
          <SalesBarChart />
        </div>
      </SectionCard>

      {/* Daily table */}
      <SectionCard title="Day-by-Day Summary">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/20 border-b border-border/30">
              <TH>Date</TH><TH>Orders</TH><TH>Revenue</TH>
            </tr>
          </thead>
          <tbody>
            {s.sales.map(row => (
              <tr key={row.date} className="border-b border-border/20 hover:bg-secondary/20 transition-colors last:border-0">
                <td className="px-5 py-3.5 font-bold text-foreground">{fmtFull(row.date)}</td>
                <td className="px-5 py-3.5 font-black text-foreground">{row.total_orders}</td>
                <td className="px-5 py-3.5 font-black text-emerald-600 dark:text-emerald-400">{fmtUSD(row.total_sales)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ─── Income Report Tab ──────────────────────────────────────────────────────────
function IncomeTab() {
  const [period, setPeriod] = useState<Period>('monthly');
  const inc    = MOCK_INCOME;
  const margin = Math.round((inc.profit / inc.total_sales) * 100);
  const cogsPct = Math.round((inc.cogs / inc.total_sales) * 100);

  const periods: { id: Period; label: string }[] = [
    { id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-2xl w-fit">
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
        <StatCard label="Total Revenue"   value={fmtUSD(inc.total_sales)}    sub={`${inc.total_orders} orders`}        accent="emerald" icon={<DollarIcon />} />
        <StatCard label="COGS"            value={fmtUSD(inc.cogs)}            sub="Cost of goods sold"                  accent="rose"    icon={<BarIcon />}    />
        <StatCard label="Gross Profit"    value={fmtUSD(inc.profit)}          sub={`${margin}% margin`}                 accent="indigo"  icon={<TrendIcon />}  />
        <StatCard label="Purchases Cost"  value={fmtUSD(inc.purchasesCost)}   sub={`${inc.purchasesQty} units bought`}  accent="amber"   icon={<BoxIcon />}    />
      </div>

      {/* Profit Margin visual */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-foreground">Profit Margin</h3>
            <p className="text-[10px] text-foreground/45 font-bold uppercase tracking-widest mt-0.5">Revenue breakdown</p>
          </div>
          <span className="text-3xl font-black text-indigo-500">{margin}%</span>
        </div>

        {/* Stacked bar */}
        <div className="w-full h-5 bg-secondary/30 rounded-full overflow-hidden flex">
          <div className="h-full bg-indigo-500 rounded-l-full transition-all duration-700" style={{ width: `${margin}%` }} />
          <div className="h-full bg-rose-500/60 transition-all duration-700" style={{ width: `${cogsPct}%` }} />
        </div>

        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
            Gross Profit ({margin}%) — {fmtUSD(inc.profit)}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/60">
            <div className="w-3 h-3 rounded-full bg-rose-500/60 shrink-0" />
            COGS ({cogsPct}%) — {fmtUSD(inc.cogs)}
          </div>
        </div>
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase font-black text-foreground/45 tracking-widest">Total Items Sold</p>
          <p className="text-3xl font-black text-foreground mt-2">{inc.totalItems.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-foreground/35 mt-1">{period} period</p>
        </div>
        <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase font-black text-foreground/45 tracking-widest">Purchases Qty</p>
          <p className="text-3xl font-black text-foreground mt-2">{inc.purchasesQty.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-foreground/35 mt-1">units restocked</p>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Report Tab ───────────────────────────────────────────────────────────
function StockReportTab() {
  const [lowOnly, setLowOnly] = useState(false);
  const [search, setSearch]   = useState('');
  const { summary, items }    = MOCK_STOCK;

  const filtered = items.filter(item => {
    if (lowOnly && item.status === 'in_stock') return false;
    const q = search.toLowerCase();
    if (q && !item.product_name.toLowerCase().includes(q) && !item.product_code.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search product or code…"
          className="px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl text-sm font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-emerald-500/50 w-56" />
        <button onClick={() => setLowOnly(!lowOnly)}
          className={`px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
            lowOnly
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
              : 'bg-secondary/40 text-foreground/60 border-border/40 hover:border-border/80'
          }`}>
          {lowOnly ? '⚠ Low / Out Only' : 'Show All'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products"  value={String(summary.total_products)}       sub="In inventory"    accent="sky"     icon={<BoxIcon />}     />
        <StatCard label="Low Stock"        value={String(summary.low_stock_count)}       sub="Need reorder"    accent="amber"   icon={<WarningIcon />} />
        <StatCard label="Out of Stock"     value={String(summary.out_of_stock_count)}    sub="Critical"        accent="rose"    icon={<BanIcon />}     />
        <StatCard label="Negative Stock"   value={String(summary.negative_stock_count)}  sub="Check movement"  accent="indigo"  icon={<AlertIcon />}   />
      </div>

      {/* Table */}
      <SectionCard title={`Stock Inventory (${filtered.length})`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/20 border-b border-border/30">
              <TH>Product</TH><TH>Code</TH><TH>Category</TH><TH>Current Stock</TH><TH>Min Threshold</TH><TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.product_id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors last:border-0">
                <td className="px-5 py-3.5 font-bold text-foreground">{item.product_name}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-foreground/50">{item.product_code}</td>
                <td className="px-5 py-3.5 text-foreground/60 font-bold">{item.category}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-base font-black ${
                    item.current_stock === 0            ? 'text-rose-500'
                    : item.current_stock <= item.low_stock_threshold ? 'text-amber-500'
                    : 'text-foreground'
                  }`}>{item.current_stock}</span>
                </td>
                <td className="px-5 py-3.5 text-foreground/50 font-bold">{item.low_stock_threshold}</td>
                <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [activeTab,   setActiveTab]   = useState<TabId>('daily');
  const [showExport,  setShowExport]  = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'daily',  label: 'Daily Report'  },
    { id: 'sales',  label: 'Sales History' },
    { id: 'income', label: 'Income Report' },
    { id: 'stock',  label: 'Stock Report'  },
  ];

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-2xl">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground text-xs font-black transition-all cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showExport ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExport && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden z-20">
              {['CSV', 'PDF'].map(fmt => (
                <button key={fmt} onClick={() => setShowExport(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-foreground/70 hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${fmt === 'CSV' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  Export as {fmt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'daily'  && <DailyTab />}
      {activeTab === 'sales'  && <SalesHistoryTab />}
      {activeTab === 'income' && <IncomeTab />}
      {activeTab === 'stock'  && <StockReportTab />}
    </div>
  );
}
