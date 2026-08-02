'use client';

import React from 'react';
import { Category } from '../../features/category/types';
import { useLanguage } from '../../contexts/language-context';
import { useAuth } from '../../hooks/useAuth';

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  errorMessage: string | null;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  getProductCount: (categoryName: string) => number;
  onRetry: () => void;
}

export default function CategoryList({
  categories,
  isLoading,
  errorMessage,
  onEdit,
  onDelete,
  getProductCount,
  onRetry,
}: CategoryListProps) {
  const { t } = useLanguage();
  const { can } = useAuth();

  const canEdit = can('catalog.categories', 'update');
  const canDelete = can('catalog.categories', 'delete');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-foreground/50">{t('pos.retrieving_catalog', 'Retrieving category index...')}</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 text-center max-w-md mx-auto py-16">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Request Failed</h3>
        <p className="text-sm text-foreground/55 mb-6">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <svg className="w-16 h-16 text-foreground/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-bold text-foreground">{t('categories.no_categories_found', 'No Categories Found')}</h3>
        <p className="text-xs text-foreground/50 mt-1.5 leading-relaxed">
          {t('categories.description', 'You haven\'t defined any medicine groups yet. Register a new category classification above to populate this panel.')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border/30 bg-secondary/10">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45 w-20">ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('categories.category_name', 'Category Name')}</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('categories.description', 'Description')}</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('categories.col_products_count', 'Products Count')}</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45">{t('products.col_status', 'Status')}</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground/45 text-right w-24">{t('common.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {categories.map((cat) => {
            const productCount = getProductCount(cat.name);
            return (
              <tr key={cat.categoryId} className="hover:bg-secondary/15 transition-colors duration-100 group">
                
                {/* ID */}
                <td className="px-6 py-4 text-sm font-semibold text-foreground/50 font-mono">
                  #{cat.categoryId}
                </td>

                {/* Name */}
                <td className="px-6 py-4 text-sm font-bold text-foreground">
                  {cat.name}
                </td>

                {/* Description */}
                <td className="px-6 py-4 text-sm text-foreground/60 max-w-sm truncate">
                  {cat.description || <span className="text-foreground/35 italic font-medium">-</span>}
                </td>

                {/* Associated Products count */}
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-secondary text-foreground text-xs font-bold rounded-lg border border-border/20">
                    {productCount} {t('dashboard.products', 'products')}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold border rounded-md uppercase tracking-wider ${
                    cat.isActive 
                      ? 'text-success bg-success/10 border-success/15'
                      : 'text-destructive bg-destructive/10 border-destructive/15'
                  }`}>
                    {cat.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(cat)}
                        title="Edit Category"
                        className="w-8 h-8 rounded-lg bg-secondary/40 hover:bg-secondary flex items-center justify-center text-foreground/70 hover:text-foreground cursor-pointer transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(cat)}
                        title="Delete Category"
                        className="w-8 h-8 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white flex items-center justify-center cursor-pointer transition-all duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    {!canEdit && !canDelete && (
                      <span className="text-[11px] text-foreground/40 italic">View Only</span>
                    )}
                  </div>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
