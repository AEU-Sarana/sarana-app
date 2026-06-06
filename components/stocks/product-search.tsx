'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../../features/product/types';
import { productService } from '../../services/productService';

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/55 mb-2">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

interface ProductSearchProps {
  value: Product | null;
  onSelect: (p: Product | null) => void;
}

export function ProductSearch({ value, onSelect }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await productService.listProducts({ search: q, status: 'active', limit: 10 });
      setResults(res.products);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    if (value) onSelect(null); // Clear selection when typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 320);
  };

  const handleSelect = (p: Product) => {
    onSelect(p);
    setQuery(p.product_name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <FieldLabel required>Product</FieldLabel>
      <div className="relative">
        <input
          id="product-search"
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by product name or barcode…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all duration-200 placeholder:text-foreground/30"
          autoComplete="off"
        />
        <svg className="absolute left-3 top-3.5 w-4 h-4 text-foreground/35 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {isSearching && (
          <div className="absolute right-3 top-3.5">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-5 text-xs text-foreground/40 font-semibold text-center">
              No active products found
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-border/20">
              {results.map((p) => (
                <li key={p.product_id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{p.product_name}</p>
                      <p className="text-[10px] text-foreground/45 font-semibold mt-0.5">
                        <span className="text-primary font-mono font-bold">#{p.product_id}</span> · {p.product_code} {p.barcode ? `· ${p.barcode}` : ''} · Stock: {p.stock_quantity}
                        {p.has_expiry && <span className="ml-1 text-amber-500">· Expiry required</span>}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Selected badge */}
      {value && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-primary/8 border border-primary/20 rounded-xl">
          <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-lg">
            #{value.product_id}
          </span>
          <span className="text-xs font-bold text-primary">{value.product_name}</span>
          <span className="text-[10px] text-primary/60 font-semibold">· Current stock: {value.stock_quantity}</span>
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery(value ? value.product_name : ''); }}
            className="ml-auto text-foreground/40 hover:text-destructive transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
