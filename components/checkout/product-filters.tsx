'use client';

import React from 'react';
import { Category } from '../../features/category/types';
import { useLanguage } from '../../contexts/language-context';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

export default function ProductFilters({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
}: ProductFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder={t('pos.search_placeholder', 'Search products by medicine name, barcode, or code...')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary/80 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
        />
        <svg className="absolute left-4 top-4.5 w-4.5 h-4.5 text-foreground/40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Horizontal Categories Quick Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar scroll-smooth">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
            selectedCategory === null
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
              : 'bg-secondary/40 text-foreground/75 border-border/40 hover:bg-secondary hover:text-foreground'
          }`}
        >
          {t('pos.all_medicines', 'All Medicines')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.categoryId}
            onClick={() => onSelectCategory(cat.categoryId)}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
              selectedCategory === cat.categoryId
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                : 'bg-secondary/40 text-foreground/75 border-border/40 hover:bg-secondary hover:text-foreground'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
