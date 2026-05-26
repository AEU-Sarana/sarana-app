'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Product, ProductStatus } from '../../../features/product/types';
import { Category, CategoryCount } from '../../../features/category/types';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import ProductModal from '../../../components/admin/product-modal';

export default function AdminProductsPage() {
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

  // Fetch all active categories & counts
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, counts] = await Promise.all([
          categoryService.listCategories(),
          categoryService.listCategoryCounts(),
        ]);
        setCategoriesList(cats);
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to fetch categories list/counts', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Products Handler
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await productService.listProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery.trim() || undefined,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });

      setProducts(response.products);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to retrieve products. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, selectedCategory, selectedStatus]);

  // Sync products list when filters or pages change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Page index handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Search input change handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchQuery(search);
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

  // Expiry date helper text
  const checkExpiryStatus = (hasExpiry?: boolean, expiredAt?: string | null) => {
    if (!hasExpiry || !expiredAt) return { label: null, color: '' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expiredAt);
    expiryDate.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Expired', color: 'bg-destructive/10 text-destructive border-destructive/25' };
    } else if (diffDays <= 30) {
      return { label: `Expiring in ${diffDays}d`, color: 'bg-warning/15 text-warning border-warning/25' };
    }
    
    return { label: `Expires ${expiryDate.toLocaleDateString()}`, color: 'bg-secondary text-foreground/60 border-border/20' };
  };

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Products & Medicines</h1>
          <p className="text-xs text-foreground/50 mt-1">
            Manage your pharmacy catalog, check inventory levels, and register medicine parameters.
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all duration-150 hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* 2. Stats bar / category quick filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total catalog items */}
        <div className="p-5 bg-card border border-border/40 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground/45 tracking-widest block">Total Products</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">{pagination.total}</span>
          </div>
        </div>

        {/* Low Stock Alerts count */}
        <div className="p-5 bg-card border border-border/40 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-extrabold shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground/45 tracking-widest block">Low Stock Items</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">
              {products.filter(p => p.low_stock_threshold !== null && p.stock_quantity < p.low_stock_threshold).length}
            </span>
          </div>
        </div>

        {/* Categories Count */}
        <div className="p-5 bg-card border border-border/40 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-extrabold shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground/45 tracking-widest block">Categories</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">{categoriesList.length}</span>
          </div>
        </div>

        {/* Expired / Warning Medicine */}
        <div className="p-5 bg-card border border-border/40 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-extrabold shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground/45 tracking-widest block">Expiring Tracked</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">
              {products.filter(p => p.has_expiry).length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search and filter tools */}
      <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Search box */}
          <div className="lg:col-span-5 relative">
            <input
              type="text"
              placeholder="Search product by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-semibold focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="">All Categories</option>
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
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-semibold focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Button actions */}
          <div className="lg:col-span-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-secondary hover:bg-secondary/80 font-bold text-sm text-foreground/80 hover:text-foreground rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="px-3 bg-secondary/40 hover:bg-secondary border border-border/30 rounded-xl text-foreground/60 hover:text-foreground transition-all duration-150 cursor-pointer flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
              </svg>
            </button>
          </div>

        </form>
      </div>

      {/* 4. Products Table */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-semibold text-foreground/50">Retrieving pharmacy catalog...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-8 text-center max-w-md mx-auto py-16">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Request Failed</h3>
            <p className="text-sm text-foreground/55 mb-6">{errorMessage}</p>
            <button
              onClick={fetchProducts}
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/95 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 max-w-sm mx-auto">
            <svg className="w-16 h-16 text-foreground/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2M5 13V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2" />
            </svg>
            <h3 className="text-lg font-bold text-foreground">No Products Found</h3>
            <p className="text-xs text-foreground/50 mt-1.5 leading-relaxed">
              No medicines match your query. Try resetting filters or register a new product to populate the catalog list.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 px-5 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/10">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45 w-16">Item</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">Product & Barcode</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">Unit Price</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">Stock Level</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {products.map((product) => {
                  // Determine stock color formatting
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isLowStock = product.low_stock_threshold !== null && product.stock_quantity < product.low_stock_threshold && !isOutOfStock;
                  
                  let stockColorClass = 'text-success bg-success/10 border-success/15';
                  let stockText = `${product.stock_quantity} in stock`;
                  if (isOutOfStock) {
                    stockColorClass = 'text-destructive bg-destructive/10 border-destructive/15';
                    stockText = 'Out of Stock';
                  } else if (isLowStock) {
                    stockColorClass = 'text-warning bg-warning/10 border-warning/15';
                    stockText = `${product.stock_quantity} Low Alert`;
                  }

                  // Determine expiry status details
                  const expiry = checkExpiryStatus(product.has_expiry, product.expired_at);

                  return (
                    <tr key={product.product_id} className="hover:bg-secondary/15 transition-colors duration-100 group">
                      
                      {/* 1. Thumbnail Image */}
                      <td className="px-6 py-3.5">
                        <div className="w-12 h-12 bg-secondary/35 rounded-xl border border-border/20 overflow-hidden flex items-center justify-center relative shadow-sm shrink-0">
                          {product.image_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_path}
                              alt={product.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <svg className="w-5 h-5 text-foreground/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* 2. Product Name & Barcode */}
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-foreground leading-tight truncate">
                            {product.product_name}
                          </span>
                          <span className="text-xs font-mono text-foreground/45 mt-0.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {product.barcode}
                          </span>
                        </div>
                      </td>

                      {/* 3. Category */}
                      <td className="px-6 py-3.5 text-sm font-semibold text-foreground/70">
                        {product.category || <span className="text-foreground/30 font-medium">Uncategorized</span>}
                      </td>

                      {/* 4. Unit Price */}
                      <td className="px-6 py-3.5 text-sm font-extrabold text-foreground">
                        ${Number(product.price).toFixed(2)}
                      </td>

                      {/* 5. Stock Level + Expiry */}
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold border rounded-md uppercase tracking-wider ${stockColorClass}`}>
                            {stockText}
                          </span>
                          {expiry.label && (
                            <span className={`px-1.5 py-0.5 text-[9px] font-semibold border rounded-md ${expiry.color}`}>
                              {expiry.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Active status switch */}
                      <td className="px-6 py-3.5">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={product.status === 'active'}
                            onChange={() => handleToggleStatus(product)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-secondary/80 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success" />
                        </label>
                      </td>

                      {/* 7. Action actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => handleEditProduct(product)}
                            title="Edit Product"
                            className="w-8 h-8 rounded-lg bg-secondary/40 hover:bg-secondary flex items-center justify-center text-foreground/70 hover:text-foreground cursor-pointer transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(product)}
                            title="Delete Product"
                            className="w-8 h-8 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white flex items-center justify-center cursor-pointer transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Controls Footer */}
        {!isLoading && !errorMessage && products.length > 0 && (
          <div className="px-6 py-4 border-t border-border/20 bg-secondary/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-foreground/45 font-semibold">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} entries found)
            </span>
            <div className="flex gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-bold bg-card text-foreground/70 hover:text-foreground disabled:opacity-40 disabled:hover:bg-card hover:bg-secondary transition-colors duration-150 cursor-pointer"
              >
                Previous
              </button>
              
              {/* Simple page numbers */}
              {Array.from({ length: pagination.totalPages }, (_, index) => {
                const p = index + 1;
                const isCurrent = p === pagination.page;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isCurrent
                        ? 'bg-primary text-white shadow-md shadow-primary/10'
                        : 'border border-border bg-card text-foreground/75 hover:bg-secondary'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-bold bg-card text-foreground/70 hover:text-foreground disabled:opacity-40 disabled:hover:bg-card hover:bg-secondary transition-colors duration-150 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-destructive/15 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-foreground">Confirm Product Deletion</h3>
              <p className="text-xs text-foreground/50 mt-2 leading-relaxed">
                Are you sure you want to remove <strong className="text-foreground">{deleteTarget.product_name}</strong>? This action soft-deletes the product from the active POS system.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border/40 bg-secondary/10 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-border bg-card text-xs font-bold text-foreground/75 hover:text-foreground hover:bg-secondary/40 rounded-xl transition-all duration-150 cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded-xl shadow-md shadow-destructive/10 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                disabled={isDeleting}
              >
                {isDeleting && (
                  <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
