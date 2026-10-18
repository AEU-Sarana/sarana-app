'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/language-context';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  entryLabel?: string;
  className?: string;
  variant?: 'table' | 'card';
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

export default function TablePagination({
  currentPage,
  totalPages,
  totalEntries,
  pageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  entryLabel,
  className = '',
  variant = 'table',
}: TablePaginationProps) {
  const { t } = useLanguage();

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(String(pageSize));

  // Sync custom input value with pageSize prop
  useEffect(() => {
    setCustomInputValue(String(pageSize));
    if (pageSizeOptions.includes(pageSize)) {
      setIsCustomMode(false);
    }
  }, [pageSize, pageSizeOptions]);

  // Don't render if there are no entries at all
  if (totalEntries !== undefined && totalEntries === 0) {
    return null;
  }

  // Calculate entry range: e.g. 1-10 of 45
  const from = totalEntries !== undefined && totalEntries > 0
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const to = totalEntries !== undefined
    ? Math.min(currentPage * pageSize, totalEntries)
    : 0;

  // Windowed visible page numbers with ellipsis
  const getVisiblePages = (current: number, total: number): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (total <= 7) {
      return Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-end', total];
    }
    if (current >= total - 3) {
      return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total];
  };

  const visiblePages = getVisiblePages(currentPage, totalPages);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0 && onPageSizeChange) {
        onPageSizeChange(parsed);
      }
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customInputValue.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000 && onPageSizeChange) {
      onPageSizeChange(parsed);
      if (pageSizeOptions.includes(parsed)) {
        setIsCustomMode(false);
      }
    }
  };

  const containerStyles = variant === 'card'
    ? 'flex flex-col sm:flex-row justify-between items-center gap-4 select-none bg-card border border-border/40 rounded-3xl p-4 shadow-sm'
    : 'px-6 py-4.5 border-t border-border/20 bg-secondary/5 flex flex-col sm:flex-row justify-between items-center gap-4 select-none';

  const labelText = entryLabel || t('common.entries', 'entries');

  return (
    <div className={`${containerStyles} ${className}`}>
      {/* Left: Entries Info & Rows Per Page Selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60 font-semibold">
        {totalEntries !== undefined ? (
          <span>
            {t('common.showing_range', 'Showing {{from}}–{{to}} of {{total}} {{label}}')
              .replace('{{from}}', String(from))
              .replace('{{to}}', String(to))
              .replace('{{total}}', String(totalEntries))
              .replace('{{label}}', labelText)}
          </span>
        ) : (
          <span>
            {t('common.showing_page', 'Page {{page}} of {{totalPages}}')
              .replace('{{page}}', String(currentPage))
              .replace('{{totalPages}}', String(totalPages))}
          </span>
        )}

        {/* Rows Per Page Controls */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2 pl-2 sm:border-l border-border/40">
            <span className="text-foreground/45 hidden sm:inline">
              {t('common.rows_per_page', 'Per page:')}
            </span>

            {!isCustomMode ? (
              <div className="relative inline-flex items-center">
                <select
                  value={pageSizeOptions.includes(pageSize) ? String(pageSize) : (pageSize ? String(pageSize) : '10')}
                  onChange={handleSelectChange}
                  className="appearance-none bg-card hover:bg-secondary/40 text-foreground text-xs font-bold border border-border/50 rounded-xl pl-3 pr-7 py-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  aria-label="Items per page"
                >
                  {/* Preset Options */}
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} {t('common.per_page', '/ page')}
                    </option>
                  ))}
                  {/* If custom size currently active, display it */}
                  {!pageSizeOptions.includes(pageSize) && (
                    <option value={pageSize}>
                      {pageSize} {t('common.per_page', '/ page')}
                    </option>
                  )}
                  <option value="custom">
                    {t('common.custom_limit', 'Custom...')}
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground/40">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    autoFocus
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-20 bg-card text-foreground text-xs font-bold border border-primary/50 focus:border-primary rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
                  />
                  <span className="text-[10px] text-foreground/40 absolute -bottom-4 left-1 font-normal">
                    (1-1000)
                  </span>
                </div>
                <button
                  type="submit"
                  title="Apply custom page size"
                  className="px-2.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  ✓
                </button>
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomInputValue(String(pageSize));
                  }}
                  className="px-2 py-1.5 bg-secondary text-foreground/60 text-xs font-bold rounded-xl hover:text-foreground transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page Button (only if > 5 pages) */}
          {totalPages > 5 && (
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              className="w-8 h-8 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title="First Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Previous Page Button */}
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="w-8 h-8 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title="Previous Page"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Number Buttons with Ellipsis */}
          {visiblePages.map((item, idx) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <span
                  key={`${item}-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-xs font-bold text-foreground/35 select-none"
                >
                  •••
                </span>
              );
            }

            const p = item as number;
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-sm ${
                  isCurrent
                    ? 'bg-gradient-to-tr from-primary to-accent text-white shadow-md shadow-primary/20 border border-transparent font-black'
                    : 'border border-border/60 bg-card text-foreground/75 hover:bg-secondary hover:text-foreground'
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="w-8 h-8 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title="Next Page"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Last Page Button (only if > 5 pages) */}
          {totalPages > 5 && (
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title="Last Page"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
