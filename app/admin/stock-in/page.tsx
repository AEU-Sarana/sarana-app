'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { productService } from '../../../services/productService';
import { stockService } from '../../../services/stockService';
import { Product } from '../../../features/product/types';
import { StockMovementItem } from '../../../features/stock/types';
import { ProductSearch } from '../../../components/stocks/product-search';
import { StockMovementTable } from '../../../components/stocks/stock-movement-table';

// ─── Sub-components ────────────────────────────────────────────────────────────

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
  quantity: string;
  cost: string;
  supplier: string;
  expired_at: string;
}

const DEFAULT_FORM: FormState = {
  quantity: '',
  cost: '',
  supplier: '',
  expired_at: '',
};

export default function AdminStockInPage() {
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
  const HISTORY_LIMIT = 10;

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await stockService.getMovements({
        movement_type: 'STOCK_IN',
        page,
        limit: HISTORY_LIMIT,
      });
      setHistory(res.movements);
      setHistoryTotal(res.pagination.total);
      setHistoryTotalPages(res.pagination.totalPages);
    } catch {
      // silently fail on history
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
    // reset expiry if product doesn't need it
    if (!p?.has_expiry) {
      setForm((prev) => ({ ...prev, expired_at: '' }));
    }
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { setSubmitError('Please select a product.'); return; }
    const qty = parseInt(form.quantity, 10);
    if (!qty || qty < 1) { setSubmitError('Quantity must be at least 1.'); return; }
    if (selectedProduct.has_expiry && !form.expired_at) {
      setSubmitError('This product requires an expiry date.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload: any = {
        product_id: selectedProduct.product_id,
        quantity: qty,
      };
      if (form.cost) payload.cost = parseFloat(form.cost);
      if (form.supplier.trim()) payload.supplier = form.supplier.trim();
      if (form.expired_at) payload.expired_at = new Date(form.expired_at).toISOString();

      await stockService.stockIn(payload);

      setSubmitSuccess(`Successfully added ${qty} unit(s) of "${selectedProduct.product_name}" to stock.`);
      setSelectedProduct(null);
      setForm(DEFAULT_FORM);

      // Refresh history
      setHistoryPage(1);
      fetchHistory(1);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err.message || 'Failed to submit stock in. Please try again.');
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
            <h1 className="text-2xl font-black text-foreground tracking-tight">Stock In</h1>
            <p className="text-xs text-foreground/50 mt-1">
              Receive new inventory and record it into the system.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-foreground/40 font-semibold bg-secondary/20 border border-border/20 px-3.5 py-2 rounded-xl select-none">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Stock In Movement
        </div>
      </div>

      {/* ── Feedback ── */}
      {submitSuccess && (
        <div className="flex items-start gap-3 px-5 py-4 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-2xl">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div className="flex items-start gap-3 px-5 py-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground tracking-tight">Receive Stock</h2>
            <p className="text-[11px] text-foreground/50 mt-0.5">Fill in the details for the incoming stock.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          {/* Product search */}
          <ProductSearch value={selectedProduct} onSelect={handleSelectProduct} />

          <div className="h-px bg-border/20" />

          {/* Quantity + Cost + Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel required>Quantity</FieldLabel>
              <InputField
                id="quantity"
                type="number"
                value={form.quantity}
                onChange={(v) => setField('quantity', v)}
                placeholder="e.g. 50"
                min="1"
              />
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">Number of units received</p>
            </div>
            <div>
              <FieldLabel>Cost per Unit ($)</FieldLabel>
              <InputField
                id="cost"
                type="number"
                value={form.cost}
                onChange={(v) => setField('cost', v)}
                placeholder="e.g. 2.50"
                min="0"
                step="0.01"
              />
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">Optional — purchase cost per unit</p>
            </div>

            {/* Expiry Date — sits below Cost per Unit in the right column */}
            <div className={selectedProduct?.has_expiry ? 'relative' : ''}>
              <FieldLabel required={!!selectedProduct?.has_expiry}>
                Expiry Date
                {selectedProduct?.has_expiry && (
                  <span className="ml-1.5 text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-md normal-case tracking-normal font-bold">
                    Required for this product
                  </span>
                )}
              </FieldLabel>
              <InputField
                id="expired_at"
                type="date"
                value={form.expired_at}
                onChange={(v) => setField('expired_at', v)}
                disabled={!selectedProduct?.has_expiry && !form.expired_at}
              />
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">
                {selectedProduct?.has_expiry
                  ? 'This product tracks expiry — date is mandatory.'
                  : 'Only applicable for products with expiry tracking.'}
              </p>
            </div>

            {/* Supplier */}
            <div>
              <FieldLabel>Supplier</FieldLabel>
              <InputField
                id="supplier"
                value={form.supplier}
                onChange={(v) => setField('supplier', v)}
                placeholder="e.g. ABC Distributor Co."
              />
              <p className="text-[10px] text-foreground/35 font-semibold mt-1.5">Optional — supplier name</p>
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
                  Processing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Confirm Stock In
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-5 py-3 border border-border/50 hover:border-border text-xs font-bold text-foreground/60 hover:text-foreground rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              Reset
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
        onPageChange={setHistoryPage}
        type="stock-in"
      />

    </div>
  );
}
