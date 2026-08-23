'use client';

import React from 'react';
import { TopSellingProduct } from '@/features/dashboard/types';

interface TopProductsCardProps {
  products: TopSellingProduct[];
  isLoading?: boolean;
  onSortChange?: (mode: 'quantity' | 'revenue') => void;
  activeSort?: 'quantity' | 'revenue';
}

export const TopProductsCard: React.FC<TopProductsCardProps> = ({
  products,
  isLoading = false,
  onSortChange,
  activeSort = 'quantity',
}) => {
  const maxVal = products.length > 0
    ? Math.max(...products.map(p => activeSort === 'quantity' ? p.units_sold : p.total_revenue))
    : 1;

  const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black shadow-sm';
      case 2:
        return 'bg-slate-400/20 text-slate-700 dark:text-slate-300 border-slate-400/30 font-black shadow-sm';
      case 3:
        return 'bg-amber-700/20 text-amber-800 dark:text-amber-300 border-amber-700/30 font-black shadow-sm';
      default:
        return 'bg-secondary/60 text-foreground/70 border-border/40 font-bold';
    }
  };

  return (
    <div className="p-6 bg-card border border-border/40 hover:border-border/80 rounded-3xl transition-all duration-300 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-6.75a1.125 1.125 0 01-1.125-1.125v-3.375m9 0A3.375 3.375 0 0015.375 6h-6.75A3.375 3.375 0 005.25 9.375m11.25 0v3.375" />
              </svg>
            </span>
            <h3 className="font-extrabold text-foreground text-base tracking-tight">
              Top Products This Month
            </h3>
          </div>
          <p className="text-xs text-foreground/50 mt-1">
            Highest performing inventory based on monthly sales data.
          </p>
        </div>

        {/* View Sort Toggle */}
        <div className="inline-flex p-1 bg-secondary/50 rounded-xl border border-border/30 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSortChange?.('quantity')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSort === 'quantity'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            By Units
          </button>
          <button
            type="button"
            onClick={() => onSortChange?.('revenue')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSort === 'revenue'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            By Revenue
          </button>
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse py-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-secondary/40 rounded-lg shrink-0" />
              <div className="w-10 h-10 bg-secondary/40 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-secondary/40 rounded w-2/3" />
                <div className="h-2 bg-secondary/30 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-foreground/40 text-xs font-medium">
          No sales recorded for this month yet.
        </div>
      ) : (
        <div className="space-y-4.5 py-1">
          {products.map((product) => {
            const currentVal = activeSort === 'quantity' ? product.units_sold : product.total_revenue;
            const percentage = Math.round((currentVal / maxVal) * 100);

            return (
              <div key={product.product_id} className="group flex items-center gap-3">
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shrink-0 ${getRankBadgeClass(
                    product.rank
                  )}`}
                >
                  #{product.rank}
                </div>

                {/* Product Thumbnail */}
                <div className="w-10 h-10 rounded-xl bg-secondary/40 border border-border/30 overflow-hidden shrink-0 flex items-center justify-center">
                  {product.image_path ? (
                    <img
                      src={product.image_path}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>

                {/* Product Details & Progress Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                      {product.product_name}
                    </span>
                    <span className="text-xs font-bold text-foreground/90 shrink-0">
                      {activeSort === 'quantity'
                        ? `${product.units_sold} units`
                        : formatCurrency(product.total_revenue)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/80 group-hover:bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
