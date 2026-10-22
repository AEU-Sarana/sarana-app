'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../../features/product/types';
import { productService } from '../../services/productService';
import { useLanguage } from '../../contexts/language-context';

import BarcodeScannerModal from '../ui/barcode-scanner-modal';

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
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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

  const handleScanBarcode = async (code: string) => {
    const cleanCode = code.trim();
    setQuery(cleanCode);
    setIsSearching(true);
    try {
      const res = await productService.listProducts({ search: cleanCode, status: 'active', limit: 5 });
      if (res.products.length === 1) {
        handleSelect(res.products[0]);
      } else if (res.products.length > 1) {
        const exact = res.products.find(
          (p) => p.barcode?.toLowerCase() === cleanCode.toLowerCase()
        );
        if (exact) {
          handleSelect(exact);
        } else {
          setResults(res.products);
          setIsOpen(true);
        }
      } else {
        setResults([]);
        setIsOpen(true);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <FieldLabel required>{t('stock_in_page.product', 'Product')}</FieldLabel>
      <div className="relative flex items-center">
        <input
          id="product-search"
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('stock_in_page.search_placeholder', 'Search by product name or barcode…')}
          className="w-full pl-10 pr-20 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all duration-200 placeholder:text-foreground/30"
          autoComplete="off"
        />
        <svg className="absolute left-3 top-3.5 w-4 h-4 text-foreground/35 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isSearching && (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-colors cursor-pointer border border-primary/20"
            title={t('scanner.scan_barcode', 'Scan Barcode')}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h2v6H7zm4 0h2v6h-2zm4 0h2v6h-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanBarcode}
        title={t('scanner.scan_barcode', 'Scan Barcode')}
        subtitle={t('stock_in_page.search_placeholder', 'Search by product name or barcode…')}
        allowContinuous={false}
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-5 text-xs text-foreground/40 font-semibold text-center">
              {t('stock_in_page.no_active_products', 'No active products found')}
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
                        <span className="text-primary font-mono font-bold">#{p.product_id}</span> · {p.product_code} {p.barcode ? `· ${p.barcode}` : ''} · {t('stock.current_stock', 'Current Stock')}: {p.stock_quantity}
                        {p.has_expiry && <span className="ml-1 text-amber-500">· {t('stock_in_page.expiry_required_badge', 'Expiry required')}</span>}
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
          <span className="text-[10px] text-primary/60 font-semibold">· {t('stock_in_page.current_stock_badge', 'Current stock:')} {value.stock_quantity}</span>
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
