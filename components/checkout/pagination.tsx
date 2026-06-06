'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 select-none bg-card border border-border/40 rounded-3xl p-4 shadow-sm">
      <span className="text-xs text-foreground/45 font-semibold">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="w-8.5 h-8.5 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
          const p = start + i;
          if (p < 1 || p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8.5 h-8.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                p === currentPage
                  ? 'bg-gradient-to-tr from-primary to-accent text-white shadow-md border border-transparent font-black'
                  : 'border border-border bg-card text-foreground/75 hover:bg-secondary'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="w-8.5 h-8.5 rounded-xl border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
