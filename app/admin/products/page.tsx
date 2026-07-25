'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductStatus } from '../../../features/product/types';
import { Category, CategoryCount } from '../../../features/category/types';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import ProductModal from '../../../components/products/product-modal';
import ProductList from '../../../components/products/product-list';
import ProductDeleteModal from '../../../components/products/product-delete-modal';
import ProductDetailModal from '../../../components/products/product-detail-modal';
import { useLanguage } from '../../../contexts/language-context';

export default function AdminProductsPage() {
  const { t } = useLanguage();
  // Products listing state
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters State
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Committed search query
  const [selectedCategory, setSelectedCategory] = useState<string | number>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Debounce search input to searchQuery to prevent excessive API requests
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Categories lists (both all active list and category count metadata)
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);

  // Page loading & errors
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Detail Modal State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Stats state (for global stats of the entire database)
  const [statsData, setStatsData] = useState({
    totalCount: 0,
    lowStockCount: 0,
    expiringCount: 0,
  });

  // Load products list from API backend
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await productService.listProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery.trim() || undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        status: (selectedStatus as ProductStatus) || undefined,
      });

      setProducts(response.products || []);
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        }));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to retrieve products list from server.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, selectedCategory, selectedStatus]);

  // Load Metadata (Categories list & Stock stats)
  const fetchMetadata = useCallback(async () => {
    try {
      const [cats, counts, stockRes] = await Promise.all([
        categoryService.listCategories(false),
        categoryService.listCategoryCounts(),
        productService.listProducts({ limit: 1000 }),
      ]);
      setCategoriesList(cats);
      setCategoryCounts(counts);

      if (stockRes && stockRes.products) {
        const allProds = stockRes.products;
        const lowStock = allProds.filter(
          (p) => p.low_stock_threshold !== null && p.stock_quantity < p.low_stock_threshold
        ).length;
        setStatsData({
          totalCount: stockRes.pagination?.total || allProds.length,
          lowStockCount: lowStock,
          expiringCount: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load products metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Clear Filters
  const handleResetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Add Product button trigger
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Edit Product button trigger
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Toggle status inline
  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await productService.toggleProductStatus(product.product_id);
      
      // Update local state directly to be reactive
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === product.product_id
            ? { ...p, status: response.status }
            : p
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle status', err);
      alert(err.message || 'Failed to toggle product status.');
    }
  };

  // Delete product action trigger
  const handleDeleteTrigger = (product: Product) => {
    setDeleteTarget(product);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await productService.deleteProduct(deleteTarget.product_id);
      setDeleteTarget(null);
      
      // Refresh list
      fetchProducts();
      
      // Refresh category counts
      const counts = await categoryService.listCategoryCounts();
      setCategoryCounts(counts);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete the product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('header.products_title', 'Products & Medicines')}</h1>
          <p className="text-xs text-foreground/50 mt-1">
            {t('header.products_subtitle', 'Manage your pharmacy catalog, check inventory levels, and register medicine parameters.')}
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fetchProducts()}
            disabled={isLoading}
            title="Refresh Catalog Data"
            className="group flex-1 sm:flex-initial px-4.5 py-3 bg-secondary/50 hover:bg-secondary dark:bg-secondary/20 dark:hover:bg-secondary/35 border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{isLoading ? t('reports.loading', 'Refreshing...') : t('common.refresh', 'Refresh')}</span>
          </button>
          
          <button
            onClick={handleAddProduct}
            className="flex-1 sm:flex-initial px-5 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {t('products.add_product', 'Add Product')}
          </button>
        </div>
      </div>

      {/* 2. Stats bar / category quick filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total catalog items */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 hover:shadow-sm hover:shadow-primary/5 transition-all duration-300 select-none">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-300" />
          <div className="w-13 h-13 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-primary/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('products.total_products', 'Total Products')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">{statsData.totalCount}</span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">{t('products.active_products', 'Active catalog items')}</span>
          </div>
        </div>

        {/* Low Stock Alerts count */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 hover:shadow-sm hover:shadow-warning/5 transition-all duration-300 select-none">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-warning/5 blur-2xl group-hover:bg-warning/10 transition-colors duration-300" />
          <div className="w-13 h-13 rounded-2xl bg-warning/10 text-warning flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-warning/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('products.low_stock_warnings', 'Low Stock Items')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">
              {statsData.lowStockCount}
            </span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">{t('reports.need_reorder', 'Require restock attention')}</span>
          </div>
        </div>

        {/* Categories Count */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 hover:shadow-sm hover:shadow-accent/5 transition-all duration-300 select-none">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors duration-300" />
          <div className="w-13 h-13 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-accent/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('products.categories_count', 'Categories')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">{categoriesList.length}</span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">{t('header.categories_subtitle', 'Medicine groups')}</span>
          </div>
        </div>

        {/* Expired / Warning Medicine */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 hover:shadow-sm hover:shadow-destructive/5 transition-all duration-300 select-none">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-destructive/5 blur-2xl group-hover:bg-destructive/10 transition-colors duration-300" />
          <div className="w-13 h-13 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-destructive/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('dashboard.expired', 'Expiring Tracked')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">
              {statsData.expiringCount}
            </span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">{t('reports.critical', 'Under strict tracking')}</span>
          </div>
        </div>
      </div>

      {/* 3. Search and filter tools */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Search box */}
          <div className="lg:col-span-7 relative">
            <input
              type="text"
              placeholder={t('products.search_placeholder', 'Search medicine name, barcode, or code...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary/80 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
            />
            <svg className="absolute left-4 top-4 w-5 h-5 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="">{t('products.all_categories', 'All Categories')}</option>
              {categoriesList.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="">{t('products.all_statuses', 'All Status')}</option>
              <option value="active">{t('common.active', 'Active')}</option>
              <option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>

        </div>

        {/* Clear Filters (shows dynamically when any filter is active) */}
        {(search !== '' || selectedCategory !== '' || selectedStatus !== '') && (
          <div className="flex justify-end pt-1 animate-fade-in select-none">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98 border border-primary/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('common.clear', 'Clear active filters')}
            </button>
          </div>
        )}
      </div>

      {/* 4. Products Table */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
        <ProductList
          products={products}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onEdit={handleEditProduct}
          onDelete={handleDeleteTrigger}
          onToggleStatus={handleToggleStatus}
          onViewDetail={setViewingProduct}
          onRetry={fetchProducts}
          onResetFilters={handleResetFilters}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalEntries={pagination.total}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Product Add/Edit Form Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchProducts();
        }}
        product={editingProduct}
      />

      {/* Delete confirmation modal */}
      <ProductDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        productName={deleteTarget?.product_name || ''}
        isDeleting={isDeleting}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
      />
    </div>
  );
}
