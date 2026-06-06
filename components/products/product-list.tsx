'use client';

import React, { useState } from 'react';
import { Product } from '../../features/product/types';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  errorMessage: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onViewDetail: (product: Product) => void;
  onRetry: () => void;
  onResetFilters: () => void;
  // Pagination Props
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
}

// Uniquely maps product name to a beautiful soft gradient so placeholders look dynamic and premium
const getPlaceholderGradient = (name: string) => {
  const colors = [
    'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    'from-pink-500/10 to-rose-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function ProductList({
  products,
  isLoading,
  errorMessage,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetail,
  onRetry,
  onResetFilters,
  currentPage,
  totalPages,
  totalEntries,
  onPageChange,
}: ProductListProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  
  // Expiry date helper text & styling
  const checkExpiryStatus = (hasExpiry?: boolean, expiredAt?: string | null) => {
    if (!hasExpiry || !expiredAt) return { label: null, color: '', isWarning: false };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expiredAt);
    expiryDate.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        label: 'Expired', 
        color: 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15', 
        isWarning: true 
      };
    } else if (diffDays <= 30) {
      return { 
        label: `Expires in ${diffDays}d`, 
        color: 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/15', 
        isWarning: true 
      };
    }
    
    return { 
      label: `Exp: ${expiryDate.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}`, 
      color: 'bg-secondary/60 text-foreground/50 border-border/20 dark:bg-secondary/40', 
      isWarning: false 
    };
  };

  // Renders a beautiful status dot and rounded pill for stocks
  const renderStockIndicator = (qty: number, threshold: number | null) => {
    const isOutOfStock = qty <= 0;
    const isLowStock = threshold !== null && qty < threshold && !isOutOfStock;
    
    if (isOutOfStock) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 dark:bg-destructive/15">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shrink-0"></span>
          Out of Stock
        </span>
      );
    } else if (isLowStock) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning border border-warning/20 dark:bg-warning/15">
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0"></span>
          {qty} units (Low)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20 dark:bg-success/15">
          <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0"></span>
          {qty} units
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="w-6 h-6 rounded-full bg-primary/10 absolute animate-ping" />
        </div>
        <span className="text-sm font-bold text-foreground/50 tracking-wide mt-2">Retrieving pharmacy catalog...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 text-center max-w-md mx-auto py-20 animate-scale-up">
        <div className="w-16 h-16 bg-destructive/15 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4 border border-destructive/20 shadow-sm shadow-destructive/5">
          <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-foreground tracking-tight">Sync Connection Failed</h3>
        <p className="text-sm text-foreground/55 mt-2 mb-6 leading-relaxed">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-extrabold shadow-sm shadow-primary/20 transition-all cursor-pointer hover:scale-102 active:scale-98"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24 max-w-sm mx-auto animate-scale-up">
        <div className="w-16 h-16 bg-secondary/35 text-foreground/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/10">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2M5 13V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-foreground tracking-tight">No Products Found</h3>
        <p className="text-xs text-foreground/50 mt-2 leading-relaxed">
          No medicines match your query. Try resetting filters or register a new product to populate the catalog list.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-6 px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer hover:scale-102 active:scale-98"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/15 select-none">
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45 w-16">ID</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">Product & Barcode</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">Category</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">Unit Price</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">Stock Level</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">Expired At</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45">Status</th>
              <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-foreground/45 text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {products.map((product) => {
              const expiry = checkExpiryStatus(product.has_expiry, product.expired_at);
              const gradClass = getPlaceholderGradient(product.product_name);

              return (
                <tr key={product.product_id} className="hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-colors duration-150 group">
                  
                  {/* Product ID */}
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono font-bold text-foreground/55 bg-secondary/40 border border-border/20 px-2 py-1 rounded-lg">
                      #{product.product_id}
                    </span>
                  </td>

                  {/* Product Name & Barcode */}
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                        {product.product_name}
                      </span>
                      <span className="text-[10px] font-mono text-foreground/45 mt-1 flex items-center gap-1 bg-secondary/40 border border-border/20 rounded px-1.5 py-0.5 w-max">
                        <svg className="w-3 h-3 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {product.barcode}
                      </span>
                    </div>
                  </td>

                  {/* Category Badge */}
                  <td className="px-6 py-3.5">
                    {product.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/50 text-foreground/75 border border-border/30 dark:bg-secondary/35">
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-foreground/30 text-xs italic font-medium">Uncategorized</span>
                    )}
                  </td>

                  {/* Unit Price */}
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-extrabold text-foreground">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  </td>

                  {/* Stock Level */}
                  <td className="px-6 py-3.5">
                    {renderStockIndicator(product.stock_quantity, product.low_stock_threshold)}
                  </td>

                  {/* Expired At */}
                  <td className="px-6 py-3.5">
                    {product.has_expiry && product.expired_at ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-semibold text-foreground">
                          {new Date(product.expired_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {expiry.label && (expiry.label === 'Expired' || expiry.label.startsWith('Expires in')) && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border rounded ${expiry.color}`}>
                            <svg className="w-2.5 h-2.5 animate-pulse text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {expiry.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-foreground/30 text-xs italic font-medium select-none">-</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-3.5">
                    {product.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/20 dark:bg-success/10 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary/65 text-foreground/40 border border-border/20 dark:bg-secondary/40 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 shrink-0"></span>
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-3.5 text-right relative">
                    <div className="flex items-center justify-end gap-3">
                      {/* Active/Inactive Toggle Switch */}
                      <button
                        onClick={() => onToggleStatus(product)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          product.status === 'active' ? 'bg-success' : 'bg-secondary'
                        }`}
                        aria-checked={product.status === 'active'}
                        role="switch"
                        title={product.status === 'active' ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            product.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu Trigger */}
                      <button
                        onClick={() => setActiveDropdownId(activeDropdownId === product.product_id ? null : product.product_id)}
                        className="w-8 h-8 rounded-lg bg-secondary/40 hover:bg-secondary/70 dark:hover:bg-secondary/35 flex items-center justify-center text-foreground/60 hover:text-foreground cursor-pointer transition-all duration-150 active:scale-95 border border-border/20 shadow-sm"
                        title="Options"
                      >
                        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      
                      {activeDropdownId === product.product_id && (
                        <>
                          {/* Invisible backdrop to capture clicks and close dropdown */}
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                          
                          {/* Floating Dropdown Card */}
                          <div className="absolute right-6 top-10 w-44 bg-card border border-border/50 rounded-xl shadow-md z-20 py-1.5 animate-scale-up select-none text-left">
                            <button
                              onClick={() => {
                                onViewDetail(product);
                                setActiveDropdownId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-bold text-foreground/75 hover:text-foreground hover:bg-secondary/50 dark:hover:bg-secondary/30 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Details
                            </button>
                            
                            <button
                              onClick={() => {
                                onEdit(product);
                                setActiveDropdownId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-bold text-foreground/75 hover:text-foreground hover:bg-secondary/50 dark:hover:bg-secondary/30 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit Product
                            </button>



                            <button
                              onClick={() => {
                                onDelete(product);
                                setActiveDropdownId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors border-t border-border/10 mt-1 pt-1.5 cursor-pointer"
                            >
                              <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Product
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Footer */}
      {totalPages > 1 && totalEntries > 10 && (
        <div className="px-6 py-4.5 border-t border-border/20 bg-secondary/5 flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
          <span className="text-xs text-foreground/45 font-semibold">
            Showing page {currentPage} of {totalPages} ({totalEntries} entries found)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="w-8.5 h-8.5 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card disabled:cursor-not-allowed transition-all duration-150 cursor-pointer flex items-center justify-center shadow-sm"
              title="Previous Page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {Array.from({ length: totalPages }, (_, index) => {
              const p = index + 1;
              const isCurrent = p === currentPage;
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
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
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
  );
}
