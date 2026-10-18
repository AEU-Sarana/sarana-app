'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../../contexts/language-context';
import {
  supplierService,
  SupplierDebtOverview,
  SupplierDebtItem,
  SupplierPaymentItem,
} from '@/services/supplierService';
import SearchableSelect from '../../../../components/ui/searchable-select';
import { PaymentSlipAttachment, SlipPreviewModal } from '../../../../components/ui/payment-slip-attachment';

export default function SupplierDebtPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'debt' | 'history'>('debt');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SupplierDebtOverview | null>(null);
  const [payments, setPayments] = useState<SupplierPaymentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Record Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDebtItem | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<number | undefined>(undefined);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('ABA_BANK');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [inspectSlip, setInspectSlip] = useState<{ url: string; ref?: string; method?: string; amount?: number } | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplierService.getSupplierDebtOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to fetch supplier debt overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await supplierService.getPaymentHistory();
      setPayments(data.payments || []);
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleOpenPayModal = (supplier: SupplierDebtItem, poId?: number, defaultAmount?: number) => {
    setSelectedSupplier(supplier);
    setSelectedPoId(poId);
    setPayAmount(defaultAmount ? defaultAmount.toString() : supplier.totalDebt.toString());
    setPaymentMethod('ABA_BANK');
    setReferenceNumber('');
    setAttachmentUrl('');
    setNotes('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setSelectedSupplier(null);
    setSelectedPoId(undefined);
    setAttachmentUrl('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await supplierService.recordPayment({
        supplier_id: selectedSupplier.supplierId,
        po_id: selectedPoId,
        amount: amountNum,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        attachment_url: attachmentUrl || undefined,
        notes: notes || undefined,
      });

      setSuccessMessage('Payment recorded successfully!');
      setTimeout(() => {
        handleClosePayModal();
        fetchOverview();
        if (activeTab === 'history') fetchHistory();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {t('supplier_debt.title', 'Supplier Debt & Accounts Payable')}
          </h1>
          <p className="text-xs font-medium text-foreground/60 mt-1">
            {t('supplier_debt.subtitle', 'Track outstanding balances, payment terms, and record debt paydowns to vendors.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/purchasing"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all border border-border/50 shadow-sm cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Purchase Orders
          </Link>
          <button
            onClick={fetchOverview}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all border border-border/50 shadow-sm cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('supplier_debt.refresh', 'Refresh Data')}
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Debt */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              {t('supplier_debt.total_debt', 'Total Supplier Debt')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m-9 1h18s-2-2-2-4V9a7 7 0 00-14 0v6c0 2-2 4-2 4z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {loading ? '...' : formatCurrency(overview?.metrics.totalDebt || 0)}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Outstanding liabilities owed to active suppliers</p>
          </div>
        </div>

        {/* Card 2: Overdue Debt */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              {t('supplier_debt.overdue_debt', 'Overdue Balance')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {loading ? '...' : formatCurrency(overview?.metrics.overdueDebt || 0)}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Past due dates according to payment terms</p>
          </div>
        </div>

        {/* Card 3: Paid This Month */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              {t('supplier_debt.paid_month', 'Paid This Month')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : formatCurrency(overview?.metrics.paidThisMonth || 0)}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Total payments settled to vendors in current month</p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <button
          onClick={() => setActiveTab('debt')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer ${
            activeTab === 'debt'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
          {t('supplier_debt.tab_debt', 'Supplier Debt Breakdown')}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {t('supplier_debt.tab_history', 'Payment History Ledger')}
        </button>
      </div>

      {/* TAB 1: Supplier Debt Breakdown */}
      {activeTab === 'debt' && (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-semibold">
              Loading supplier balances...
            </div>
          ) : !overview || overview.supplierDebts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-extrabold text-foreground">No Supplier Debt Found</p>
              <p className="text-xs text-foreground/50 mt-1">All purchase orders are fully settled.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden divide-y divide-border/10 p-4 space-y-4">
                {overview.supplierDebts.map((sup) => (
                  <div key={sup.supplierId} className="pt-4 first:pt-0 space-y-3 select-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{sup.companyName}</h4>
                          {sup.isOverdue && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">
                              Overdue
                            </span>
                          )}
                        </div>
                        {(sup.contactPerson || sup.phone) && (
                          <p className="text-[11px] font-normal text-foreground/50 mt-0.5">
                            {sup.contactPerson} {sup.phone ? `(${sup.phone})` : ''}
                          </p>
                        )}
                        <span className="text-[10px] text-foreground/45 block mt-1">
                          Terms: <strong className="text-foreground">{sup.paymentTerms || 'NET_30'}</strong> · Due: <strong className="text-foreground">{formatDate(sup.oldestDueDate)}</strong>
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 block font-mono">
                          {formatCurrency(sup.totalDebt)}
                        </span>
                        <span className="text-[10px] text-foreground/40 block font-semibold">{sup.openPOCount} Open POs</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/10">
                      <button
                        onClick={() => handleOpenPayModal(sup)}
                        disabled={sup.totalDebt <= 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-30 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Pay Debt
                      </button>
                    </div>

                    {sup.openPOs.length > 0 && (
                      <div className="pt-2 space-y-2 border-t border-border/10">
                        <p className="text-[10px] uppercase tracking-wider font-extrabold text-foreground/40">Open POs:</p>
                        <div className="space-y-2">
                          {sup.openPOs.map((po) => (
                            <div key={po.poId} className="p-3 bg-secondary/20 border border-border/30 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <p className="font-extrabold text-foreground">{po.poNumber}</p>
                                <p className="text-[10px] text-foreground/50 mt-0.5">
                                  Due: {formatDate(po.dueDate)} | Balance: <span className="font-bold text-rose-500">{formatCurrency(po.balanceDue)}</span>
                                </p>
                              </div>
                              <button
                                onClick={() => handleOpenPayModal(sup, po.poId, po.balanceDue)}
                                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] rounded-lg transition-all cursor-pointer shrink-0"
                              >
                                Pay PO
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4">Supplier / Vendor</th>
                      <th className="px-6 py-4">Payment Terms</th>
                      <th className="px-6 py-4 text-center">Open POs</th>
                      <th className="px-6 py-4">Oldest Due Date</th>
                      <th className="px-6 py-4 text-right">Total Debt</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {overview.supplierDebts.map((sup) => (
                      <React.Fragment key={sup.supplierId}>
                        <tr className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-4 font-bold">
                            <div className="flex items-center gap-2">
                              <span>{sup.companyName}</span>
                              {sup.isOverdue && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {(sup.contactPerson || sup.phone) && (
                              <p className="text-[11px] font-normal text-foreground/50 mt-0.5">
                                {sup.contactPerson} {sup.phone ? `(${sup.phone})` : ''}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-xs text-foreground/70">
                            <span className="px-2.5 py-1 rounded-lg bg-secondary border border-border/40 text-foreground">
                              {sup.paymentTerms || 'NET_30'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-extrabold text-xs">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
                              {sup.openPOCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-foreground/70">
                            {formatDate(sup.oldestDueDate)}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-rose-600 dark:text-rose-400">
                            {formatCurrency(sup.totalDebt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenPayModal(sup)}
                              disabled={sup.totalDebt <= 0}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Pay Debt
                            </button>
                          </td>
                        </tr>

                        {/* Nested PO breakdown row if open POs exist */}
                        {sup.openPOs.length > 0 && (
                          <tr className="bg-secondary/10">
                            <td colSpan={6} className="px-8 py-3">
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider font-extrabold text-foreground/40">
                                  Open Purchase Orders:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {sup.openPOs.map((po) => (
                                    <div
                                      key={po.poId}
                                      className="p-3 bg-card border border-border/40 rounded-xl flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <p className="font-extrabold text-foreground">{po.poNumber}</p>
                                        <p className="text-[10px] text-foreground/50 mt-0.5">
                                          Due: {formatDate(po.dueDate)} | Balance: <span className="font-bold text-rose-500">{formatCurrency(po.balanceDue)}</span>
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleOpenPayModal(sup, po.poId, po.balanceDue)}
                                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                                      >
                                        Pay PO
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Payment History Ledger */}
      {activeTab === 'history' && (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {historyLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-semibold">
              Loading payment history...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-base font-extrabold text-foreground">No Payment History Recorded</p>
              <p className="text-xs text-foreground/50 mt-1">Payment transactions will appear here when debt is paid down.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden divide-y divide-border/10 p-4 space-y-4">
                {payments.map((p) => (
                  <div key={p.paymentId} className="pt-4 first:pt-0 space-y-2 select-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-mono font-extrabold text-primary block">{p.paymentNumber}</span>
                        <h4 className="text-sm font-bold text-foreground mt-0.5">{p.supplierName || `Supplier #${p.supplierId}`}</h4>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Date: {formatDate(p.paymentDate)} · Ref: {p.referenceNumber || 'N/A'}
                        </span>
                        {p.attachmentUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setInspectSlip({
                                url: p.attachmentUrl!,
                                ref: p.referenceNumber || undefined,
                                method: p.paymentMethod,
                                amount: p.amount,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 transition-all cursor-pointer mt-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            View Slip Proof
                          </button>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-block mt-1">
                          {p.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4">Payment #</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">PO Ref</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Ref Number</th>
                      <th className="px-6 py-4">Slip Proof</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {payments.map((p) => (
                      <tr key={p.paymentId} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-primary">{p.paymentNumber}</td>
                        <td className="px-6 py-4 font-bold">{p.supplierName || `Supplier #${p.supplierId}`}</td>
                        <td className="px-6 py-4 font-semibold text-xs text-foreground/70">
                          {p.poNumber ? (
                            <span className="px-2 py-0.5 bg-secondary rounded text-foreground">{p.poNumber}</span>
                          ) : (
                            <span className="text-foreground/40">General Paydown</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold uppercase">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-foreground/70 font-mono">{p.referenceNumber || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {p.attachmentUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setInspectSlip({
                                  url: p.attachmentUrl!,
                                  ref: p.referenceNumber || undefined,
                                  method: p.paymentMethod,
                                  amount: p.amount,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 transition-all cursor-pointer hover:scale-102"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View Slip
                            </button>
                          ) : (
                            <span className="text-foreground/30 text-xs italic">No slip</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-foreground/70">{formatDate(p.paymentDate)}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPayModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-foreground">Record Supplier Payment</h3>
                <p className="text-xs text-foreground/50 mt-0.5">Pay down debt for <span className="font-bold text-foreground">{selectedSupplier.companyName}</span></p>
              </div>
              <button
                onClick={handleClosePayModal}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground/60 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/70 mb-1.5">Supplier</label>
                <input
                  type="text"
                  readOnly
                  value={selectedSupplier.companyName}
                  className="w-full px-4 py-2.5 bg-secondary/40 border border-border/40 rounded-xl text-xs font-bold text-foreground outline-none"
                />
              </div>

              {selectedPoId && (
                <div>
                  <label className="block text-xs font-bold text-foreground/70 mb-1.5">Target Purchase Order ID</label>
                  <input
                    type="text"
                    readOnly
                    value={`PO #${selectedPoId}`}
                    className="w-full px-4 py-2.5 bg-secondary/40 border border-border/40 rounded-xl text-xs font-bold text-primary outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/70 mb-1.5">Payment Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-extrabold text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/70 mb-1.5">Payment Method *</label>
                  <SearchableSelect
                    options={[
                      { value: 'ABA_BANK', label: '🏦 ABA Bank (QR / Transfer)' },
                      { value: 'WING', label: '🟢 Wing Bank' },
                      { value: 'BANK_TRANSFER', label: '🏛️ Other Bank Transfer' },
                      { value: 'CASH', label: '💵 Cash' },
                      { value: 'CHEQUE', label: '📝 Cheque' },
                    ]}
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(String(val))}
                    placeholder="Select payment method..."
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-foreground/70">
                    Reference Number / Cheque #
                  </label>
                  {paymentMethod !== 'CASH' && (
                    <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Recommended for {paymentMethod === 'ABA_BANK' ? 'ABA' : paymentMethod === 'WING' ? 'Wing' : 'Bank/Cheque'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={
                    paymentMethod === 'ABA_BANK'
                      ? 'e.g. 984712 (ABA Transaction #)'
                      : paymentMethod === 'WING'
                      ? 'e.g. WING-89471928'
                      : paymentMethod === 'CHEQUE'
                      ? 'e.g. CHQ-004928'
                      : 'e.g. TRX-98124 / Bank Reference #'
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-semibold text-foreground focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Slip / Receipt Attachment */}
              <PaymentSlipAttachment
                value={attachmentUrl}
                onChange={setAttachmentUrl}
                recommended={paymentMethod !== 'CASH'}
              />

              <div>
                <label className="block text-xs font-bold text-foreground/70 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional payment details..."
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-medium text-foreground focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/30">
                <button
                  type="button"
                  onClick={handleClosePayModal}
                  className="px-4 py-2.5 rounded-xl border border-border/50 text-xs font-bold text-foreground/70 hover:bg-secondary transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Proof Lightbox Modal */}
      <SlipPreviewModal
        isOpen={!!inspectSlip}
        onClose={() => setInspectSlip(null)}
        imageUrl={inspectSlip?.url || ''}
        title="Supplier Debt Payment Slip Proof"
        referenceNumber={inspectSlip?.ref}
        paymentMethod={inspectSlip?.method}
        amount={inspectSlip?.amount}
      />
    </div>
  );
}
