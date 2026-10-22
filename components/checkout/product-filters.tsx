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
  onScanBarcode?: (barcode: string) => void;
}

import BarcodeScannerModal from '../ui/barcode-scanner-modal';

export default function ProductFilters({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  onScanBarcode,
}: ProductFiltersProps) {
  const { t } = useLanguage();
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);

  const handleScan = (barcode: string) => {
    if (onScanBarcode) {
      onScanBarcode(barcode);
    } else {
      onSearchChange(barcode);
    }
  };

  return (
    <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={t('pos.search_placeholder', 'Search products by medicine name, barcode, or code...')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-24 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary/80 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
        />
        <svg className="absolute left-4 top-4.5 w-4.5 h-4.5 text-foreground/40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Scan Barcode with Camera Button */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all duration-150 text-xs font-black flex items-center gap-1.5 cursor-pointer border border-primary/20 shadow-sm"
          title={t('scanner.scan_medicine', 'Scan Medicine Barcode')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h2v6H7zm4 0h2v6h-2zm4 0h2v6h-2z" />
          </svg>
          <span className="hidden sm:inline">{t('scanner.scan_barcode', 'Scan')}</span>
        </button>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        title={t('scanner.title', 'Barcode Scanner')}
        subtitle={t('scanner.subtitle', 'Point camera at medicine barcode or QR code')}
        allowContinuous={true}
        defaultContinuous={true}
      />

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
