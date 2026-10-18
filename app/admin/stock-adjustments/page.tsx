'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { stockService } from '../../../services/stockService';
import { Product } from '../../../features/product/types';
import { StockMovementItem } from '../../../features/stock/types';
import { ProductSearch } from '../../../components/stocks/product-search';
import { StockMovementTable } from '../../../components/stocks/stock-movement-table';
import { useLanguage } from '../../../contexts/language-context';

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/55 mb-2">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  min,
  step,
}: {
  id: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-foreground/30"
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface FormState {
  type: 'increase' | 'decrease';
  quantity: string;
  reason: string;
}

const DEFAULT_FORM: FormState = {
  type: 'increase',
  quantity: '',
  reason: '',
};

export default function AdminStockAdjustmentsPage() {
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<StockMovementItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);

  const fetchHistory = useCallback(async (page = 1, limit = historyLimit) => {
    setHistoryLoading(true);
    try {
      const res = await stockService.getMovements({
        movement_type: 'ADJUSTMENT',
        page,
        limit,
      });
      setHistory(res.movements);
      setHistoryTotal(res.pagination.total);
      setHistoryTotalPages(res.pagination.totalPages);
    } catch {
      // silently fail on history
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit]);

  const handleHistoryLimitChange = (newLimit: number) => {
    setHistoryLimit(newLimit);
    setHistoryPage(1);
    fetchHistory(1, newLimit);
  };

  useEffect(() => {
    fetchHistory(historyPage);
  }, [fetchHistory, historyPage]);

  const setField = (key: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSelectProduct = (p: Product | null) => {
    setSelectedProduct(p);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setSubmitError('Please select a product.');
      return;
    }
    const rawQty = parseInt(form.quantity, 10);
    if (!rawQty || rawQty < 1) {
      setSubmitError('Quantity must be at least 1.');
      return;
    }

    // final adjusted qty (+ or -)
    const adjustedQty = form.type === 'decrease' ? -rawQty : rawQty;

    // Business validation: prevent adjusting below 0
    if (form.type === 'decrease' && selectedProduct.stock_quantity - rawQty < 0) {
      setSubmitError(`Cannot decrease stock below 0. Current stock is ${selectedProduct.stock_quantity}.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        product_id: selectedProduct.product_id,
        quantity: adjustedQty,
        reason: form.reason.trim() || undefined,
      };

      await stockService.stockAdjust(payload);

      const typeLabel = form.type === 'increase' ? 'added to' : 'removed from';
      setSubmitSuccess(`Successfully adjusted stock: ${rawQty} unit(s) ${typeLabel} "${selectedProduct.product_name}".`);
      setSelectedProduct(null);
      setForm(DEFAULT_FORM);

      // Refresh history
      setHistoryPage(1);
      fetchHistory(1);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err.message || 'Failed to submit stock adjustment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setForm(DEFAULT_FORM);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="w-10 h-10 border border-border/50 hover:border-border rounded-xl transition-all text-foreground/50 hover:text-foreground hover:bg-secondary/30 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 active:scale-95"
            title="Back to Stock Inventory"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('stock_adjustments_page.title', 'Stock Adjustments')}</h1>
            <p className="text-xs text-foreground/50 mt-1">
              {t('stock_adjustments_page.subtitle', 'Manually adjust stock quantities and reconcile differences.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-foreground/40 font-semibold bg-secondary/20 border border-border/20 px-3.5 py-2 rounded-xl select-none">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {t('stock_adjustments_page.movement_badge', 'Adjustment Movement')}
        </div>
      </div>

      {/* ── Feedback ── */}
      {submitSuccess && (
        <div className="flex items-start gap-3 px-5 py-4 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-2xl animate-fade-in">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div className="flex items-start gap-3 px-5 py-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl animate-fade-in">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {submitError}
        </div>
      )}

      {/* ── Form Card ── */}
      <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-7 py-5 border-b border-border/20 bg-secondary/10">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground tracking-tight">{t('stock_adjustments_page.reconcile_stock', 'Reconcile Stock')}</h2>
            <p className="text-[11px] text-foreground/50 mt-0.5">{t('stock_adjustments_page.reconcile_stock_subtitle', 'Enter details to manually adjust the current inventory count.')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          {/* Product search */}
          <ProductSearch value={selectedProduct} onSelect={handleSelectProduct} />

          <div className="h-px bg-border/20" />

          {/* Type + Quantity + Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <FieldLabel required>{t('stock_adjustments_page.adjustment_type', 'Adjustment Type')}</FieldLabel>
              <select
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary outline-none transition-all duration-200 cursor-pointer"
              >
                <option value="increase">{t('stock_adjustments_page.increase', 'Increase (+)')}</option>
                <option value="decrease">{t('stock_adjustments_page.decrease', 'Decrease (-)')}</option>
              </select>
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">{t('stock_adjustments_page.type_help', 'Add to or subtract from shelves')}</p>
            </div>
            <div>
              <FieldLabel required>{t('stock_adjustments_page.quantity', 'Quantity')}</FieldLabel>
              <InputField
                id="quantity"
                type="number"
                value={form.quantity}
                onChange={(v) => setField('quantity', v)}
                placeholder={t('stock_adjustments_page.quantity_placeholder', 'e.g. 5')}
                min="1"
              />
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">{t('stock_adjustments_page.quantity_help', 'Number of units to adjust')}</p>
            </div>
            <div>
              <FieldLabel>{t('stock_adjustments_page.reason', 'Reason / Note')}</FieldLabel>
              <InputField
                id="reason"
                value={form.reason}
                onChange={(v) => setField('reason', v)}
                placeholder={t('stock_adjustments_page.reason_placeholder', 'e.g. Damage, inventory audit')}
              />
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">{t('stock_adjustments_page.reason_help', 'Optional — reason for discrepancy')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/20">
            <button
              type="submit"
              disabled={isSubmitting || !selectedProduct}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('stock_in_page.processing', 'Processing…')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {t('stock_adjustments_page.confirm_adjustment', 'Confirm Adjustment')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-5 py-3 border border-border/50 hover:border-border text-xs font-bold text-foreground/60 hover:text-foreground rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {t('stock_in_page.reset', 'Reset')}
            </button>
          </div>
        </form>
      </div>

      {/* ── History Table ── */}
      <StockMovementTable
        movements={history}
        isLoading={historyLoading}
        page={historyPage}
        totalPages={historyTotalPages}
        total={historyTotal}
        pageSize={historyLimit}
        onPageChange={setHistoryPage}
        onPageSizeChange={handleHistoryLimitChange}
        type="adjustment"
      />

    </div>
  );
}
