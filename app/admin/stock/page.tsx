'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { stockService } from '../../../services/stockService';
import { categoryService } from '../../../services/categoryService';
import { StockListItem, StockStatus, StockSummary } from '../../../features/stock/types';
import { Category } from '../../../features/category/types';
import { StatCard } from '../../../components/stocks/stat-card';
import { StockListTable } from '../../../components/stocks/stock-list-table';
import { useLanguage } from '../../../contexts/language-context';
import { useAuth } from '../../../hooks/useAuth';
import SearchableSelect from '../../../components/ui/searchable-select';


// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

function StockPageContent() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const canStockIn = can('stock.stock_in', 'create');
  const canAdjustStock = can('stock.adjustments', 'create');
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || '';

  const STOCK_STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: t('products.all_statuses', 'All Status') },
    { value: 'in_stock', label: t('dashboard.in_stock', 'In Stock') },
    { value: 'low_stock', label: t('dashboard.low_stock', 'Low Stock') },
    { value: 'out_of_stock', label: t('dashboard.out_of_stock', 'Out of Stock') },
    { value: 'negative', label: t('reports.negative_stock', 'Negative') },
  ];

  // ── Data ────────────────────────────────────────────────────────────────────
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [summary, setSummary] = useState<StockSummary>({
    total_products: 0,
    total_stock_quantity: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    negative_stock_count: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync url param updates with status filter state
  useEffect(() => {
    const statusParam = searchParams?.get('status') || '';
    setStatusFilter(statusParam);
  }, [searchParams]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchStock = useCallback(async (opts: {
    search?: string; status?: string; categoryId?: string; page?: number; limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const currentLimit = opts.limit ?? limit;
      const params: any = { page: opts.page ?? 1, limit: currentLimit };
      if (opts.search) params.search = opts.search;
      if (opts.status) params.status = opts.status;
      if (opts.categoryId) params.category_id = Number(opts.categoryId);

      const res = await stockService.getStockList(params);
      setStocks(res.stocks);
      setSummary(res.summary);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load stock data.');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Load categories once
  useEffect(() => {
    categoryService.listCategories().then(setCategories).catch(() => { });
  }, []);

  // Initial load
  useEffect(() => {
    fetchStock({ search, status: statusFilter, categoryId: categoryFilter, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, page]);

  // Debounced search
  const handleSearch = (v: string) => {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchStock({ search: v, status: statusFilter, categoryId: categoryFilter, page: 1 });
    }, 350);
  };

  const handleFilterChange = (key: 'status' | 'category', val: string) => {
    setPage(1);
    if (key === 'status') setStatusFilter(val);
    if (key === 'category') setCategoryFilter(val);
  };

  const handleRefresh = () => {
    fetchStock({ search, status: statusFilter, categoryId: categoryFilter, page });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
    fetchStock({ search: '', status: '', categoryId: '', page: 1, limit });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchStock({ page: 1, limit: newLimit, search, status: statusFilter, categoryId: categoryFilter });
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('header.stock_title', 'Stock Inventory')}</h1>
          <p className="text-xs text-foreground/50 mt-1">
            {t('header.stock_subtitle', 'Monitor real-time stock levels across all active products.')}
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh Stock Data"
            className="group flex-1 sm:flex-initial px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary dark:bg-secondary/20 dark:hover:bg-secondary/35 border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{isLoading ? t('reports.loading', 'Refreshing...') : t('common.refresh', 'Refresh')}</span>
          </button>
          {canStockIn && (
            <Link
              href="/admin/stock-in"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              {t('stock.stock_in', 'Stock In')}
            </Link>
          )}
          {canAdjustStock && (
            <Link
              href="/admin/stock-adjustments"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-foreground/70 hover:text-primary font-extrabold text-xs rounded-xl transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {t('stock.adjust_stock', 'Adjust')}
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('stock.total_products', 'Total Products')}
          value={summary.total_products}
          subtext={t('stock.total_products_sub', 'Active catalog items')}
          accentCls="text-primary"
          bgCls="bg-primary/10"
          hoverShadowCls="hover:shadow-primary/5"
          glowCls="bg-primary/5 group-hover:bg-primary/10"
          borderCls="border-primary/5"
          icon={
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          }
        />
        <StatCard
          label={t('stock.total_stock_qty', 'Total Stock Qty')}
          value={summary.total_stock_quantity.toLocaleString()}
          subtext={t('stock.total_stock_qty_sub', 'Items currently on shelves')}
          accentCls="text-accent"
          bgCls="bg-accent/10"
          hoverShadowCls="hover:shadow-accent/5"
          glowCls="bg-accent/5 group-hover:bg-accent/10"
          borderCls="border-accent/5"
          icon={
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.low_stock', 'Low Stock')}
          value={summary.low_stock_count}
          subtext={t('stock.low_stock_sub', 'Require restock attention')}
          accentCls="text-warning"
          bgCls="bg-warning/10"
          hoverShadowCls="hover:shadow-warning/5"
          glowCls="bg-warning/5 group-hover:bg-warning/10"
          borderCls="border-warning/5"
          icon={
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.out_of_stock', 'Out of Stock')}
          value={summary.out_of_stock_count}
          subtext={t('stock.out_of_stock_sub', 'Currently empty')}
          accentCls="text-destructive"
          bgCls="bg-destructive/10"
          hoverShadowCls="hover:shadow-destructive/5"
          glowCls="bg-destructive/5 group-hover:bg-destructive/10"
          borderCls="border-destructive/5"
          icon={
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* ── Search and Filter Tools ── */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Search box */}
          <div className="lg:col-span-7 relative">
            <input
              type="text"
              placeholder={t('stock.search_placeholder', 'Search medicine, SKU, barcode...')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary/80 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
            />
            <svg className="absolute left-4 top-4 w-5 h-5 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <SearchableSelect
              value={categoryFilter}
              onChange={(val) => handleFilterChange('category', String(val))}
              placeholder={t('products.all_categories', 'All Categories')}
              searchPlaceholder={t('products.search_category', 'Search category...')}
              allowClear
              options={[
                { value: '', label: t('products.all_categories', 'All Categories') },
                ...categories.map((c) => ({
                  value: String(c.categoryId),
                  label: c.name,
                })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary outline-none transition-all duration-200 cursor-pointer"
            >
              {STOCK_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Clear Filters (shows dynamically when any filter is active) */}
        {(search !== '' || statusFilter !== '' || categoryFilter !== '') && (
          <div className="flex justify-end pt-1 animate-fade-in select-none">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98 border border-primary/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('products.clear_filters', 'Clear active filters')}
            </button>
          </div>
        )}
      </div>

      {/* ── Table Card ── */}
      <StockListTable
        stocks={stocks}
        isLoading={isLoading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={handleLimitChange}
      />
    </div>
  );
}

export default function AdminStockPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-bold text-foreground/45 animate-pulse">Loading stock inventory...</span>
        </div>
      </div>
    }>
      <StockPageContent />
    </Suspense>
  );
}
