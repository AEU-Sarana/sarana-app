'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../../contexts/language-context';
import {
  customerService,
  CustomerDebtOverview,
  CustomerDebtItem,
  CustomerPaymentItem,
} from '@/services/customerService';

export default function CustomerDebtPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'debt' | 'history'>('debt');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CustomerDebtOverview | null>(null);
  const [payments, setPayments] = useState<CustomerPaymentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Record Payment Modal State
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebtItem | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(undefined);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomerDebtOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to fetch customer debt overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await customerService.getPaymentHistory();
      setPayments(data.payments || []);
    } catch (err: any) {
      console.error('Failed to fetch customer payment history:', err);
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

  const handleOpenCollectModal = (customer: CustomerDebtItem, orderId?: number, defaultAmount?: number) => {
    setSelectedCustomer(customer);
    setSelectedOrderId(orderId);
    setCollectAmount(defaultAmount ? defaultAmount.toString() : customer.totalDebt.toString());
    setPaymentMethod('CASH');
    setReferenceNumber('');
    setNotes('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCollectModalOpen(true);
  };

  const handleCloseCollectModal = () => {
    setIsCollectModalOpen(false);
    setSelectedCustomer(null);
    setSelectedOrderId(undefined);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amountNum = parseFloat(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid repayment amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await customerService.recordPayment({
        customer_id: selectedCustomer.customerId,
        order_id: selectedOrderId,
        amount: amountNum,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });

      setSuccessMessage('Customer payment collected successfully!');
      setTimeout(() => {
        handleCloseCollectModal();
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
            {t('customer_debt.title', 'Customer Debt & Accounts Receivable')}
          </h1>
          <p className="text-xs font-medium text-foreground/60 mt-1">
            {t('customer_debt.subtitle', 'Track customer credit accounts, overdue debt balances, and record payments.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sales"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all border border-border/50 shadow-sm cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sales History
          </Link>
          <button
            onClick={fetchOverview}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all border border-border/50 shadow-sm cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('customer_debt.refresh', 'Refresh Data')}
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Customer Debt */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              {t('customer_debt.total_debt', 'Total Customer Debt')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {loading ? '...' : formatCurrency(overview?.metrics.totalDebt || 0)}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Total credit receivables owed by customers</p>
          </div>
        </div>

        {/* Card 2: Overdue Customer Credit */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              {t('customer_debt.overdue_debt', 'Overdue Balances')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {loading ? '...' : formatCurrency(overview?.metrics.overdueDebt || 0)}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Customer debts past 30 days due date</p>
          </div>
        </div>

        {/* Card 3: Collected This Month */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
              {t('customer_debt.collected_month', 'Collected This Month')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : formatCurrency(overview?.metrics.collectedThisMonth || 0)}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Debt repayments collected in current month</p>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {t('customer_debt.tab_debt', 'Customer Balances')}
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
          {t('customer_debt.tab_history', 'Collection Ledger')}
        </button>
      </div>

      {/* TAB 1: Customer Debt Breakdown */}
      {activeTab === 'debt' && (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-semibold">
              Loading customer credit balances...
            </div>
          ) : !overview || overview.customerDebts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-extrabold text-foreground">No Customer Debt Found</p>
              <p className="text-xs text-foreground/50 mt-1">All customer accounts are fully paid.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden divide-y divide-border/10 p-4 space-y-4">
                {overview.customerDebts.map((c) => (
                  <div key={c.customerId} className="pt-4 first:pt-0 space-y-3 select-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{c.fullName}</h4>
                          {c.isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">
                              Overdue
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-foreground/50 block mt-0.5">
                          📞 {c.phone || 'No phone'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-rose-600 dark:text-rose-400 block">
                          {formatCurrency(c.totalDebt)}
                        </span>
                        <span className="text-[10px] text-foreground/40 block font-semibold">
                          {c.openOrderCount} unpaid orders
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/10 text-xs">
                      <span className="text-[10px] text-foreground/50 font-bold">
                        Oldest Due: {formatDate(c.oldestDueDate)}
                      </span>

                      <button
                        onClick={() => handleOpenCollectModal(c)}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-md shadow-primary/20 cursor-pointer"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Phone / Contact</th>
                    <th className="px-6 py-4 text-center">Unpaid Orders</th>
                    <th className="px-6 py-4">Oldest Due Date</th>
                    <th className="px-6 py-4 text-right">Debt Owed</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {overview.customerDebts.map((c) => (
                    <React.Fragment key={c.customerId}>
                      <tr className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span>{c.fullName}</span>
                            {c.isOverdue && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-xs text-foreground/70">
                          {c.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-xs">
                          <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 inline-flex items-center justify-center">
                            {c.openOrderCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-foreground/70">
                          {formatDate(c.oldestDueDate)}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-amber-600 dark:text-amber-400">
                          {formatCurrency(c.totalDebt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenCollectModal(c)}
                            disabled={c.totalDebt <= 0}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-30 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Collect Debt
                          </button>
                        </td>
                      </tr>

                      {/* Nested Order Breakdown */}
                      {c.openOrders.length > 0 && (
                        <tr className="bg-secondary/10">
                          <td colSpan={6} className="px-8 py-3">
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider font-extrabold text-foreground/40">
                                Open Customer Credit Orders:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {c.openOrders.map((ord) => (
                                  <div
                                    key={ord.orderId}
                                    className="p-3 bg-card border border-border/40 rounded-xl flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <p className="font-extrabold text-foreground">{ord.receiptNumber}</p>
                                      <p className="text-[10px] text-foreground/50 mt-0.5">
                                        Due: {formatDate(ord.dueDate)} | Balance: <span className="font-bold text-amber-500">{formatCurrency(ord.balanceDue)}</span>
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleOpenCollectModal(c, ord.orderId, ord.balanceDue)}
                                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                                    >
                                      Collect
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

      {/* TAB 2: Collection Ledger */}
      {activeTab === 'history' && (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {historyLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-semibold">
              Loading collection ledger...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-base font-extrabold text-foreground">No Debt Collections Recorded</p>
              <p className="text-xs text-foreground/50 mt-1">Repayments collected from customers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4">Collection #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Receipt Ref</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Ref Number</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {payments.map((p) => (
                    <tr key={p.paymentId} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-primary">{p.paymentNumber}</td>
                      <td className="px-6 py-4 font-bold">{p.customerName} {p.customerPhone ? `(${p.customerPhone})` : ''}</td>
                      <td className="px-6 py-4 font-semibold text-xs text-foreground/70">
                        {p.receiptNumber ? (
                          <span className="px-2 py-0.5 bg-secondary rounded text-foreground">{p.receiptNumber}</span>
                        ) : (
                          <span className="text-foreground/40">General Debt Collection</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground/70 font-mono">{p.referenceNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-foreground/70">{formatDate(p.paymentDate)}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {isCollectModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-foreground">Collect Customer Payment</h3>
                <p className="text-xs text-foreground/50 mt-0.5">Collect debt repayment from <span className="font-bold text-foreground">{selectedCustomer.fullName}</span></p>
              </div>
              <button
                onClick={handleCloseCollectModal}
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
                <label className="block text-xs font-bold text-foreground/70 mb-1.5">Customer</label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedCustomer.fullName} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}`}
                  className="w-full px-4 py-2.5 bg-secondary/40 border border-border/40 rounded-xl text-xs font-bold text-foreground outline-none"
                />
              </div>

              {selectedOrderId && (
                <div>
                  <label className="block text-xs font-bold text-foreground/70 mb-1.5">Target Order ID</label>
                  <input
                    type="text"
                    readOnly
                    value={`Order #${selectedOrderId}`}
                    className="w-full px-4 py-2.5 bg-secondary/40 border border-border/40 rounded-xl text-xs font-bold text-primary outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/70 mb-1.5">Collection Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-extrabold text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/70 mb-1.5">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-bold text-foreground focus:border-primary outline-none transition-all"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ABA_BANK">ABA Bank Transfer</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/70 mb-1.5">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TRX-ABA-98124 / Receipt Ref"
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-semibold text-foreground focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/70 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional collection details..."
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-xs font-medium text-foreground focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/30">
                <button
                  type="button"
                  onClick={handleCloseCollectModal}
                  className="px-4 py-2.5 rounded-xl border border-border/50 text-xs font-bold text-foreground/70 hover:bg-secondary transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Collect Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
