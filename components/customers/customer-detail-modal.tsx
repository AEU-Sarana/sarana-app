'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/language-context';
import { customerService, CustomerDetails, CustomerWithPurchases } from '../../services/customerService';
import { getInitials } from '../../libs/utils';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerWithPurchases | null;
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
}: CustomerDetailModalProps) {
  const { t } = useLanguage();
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'purchases' | 'payments'>('orders');

  useEffect(() => {
    if (isOpen && customer) {
      const fetchDetails = async () => {
        try {
          setIsLoading(true);
          const data = await customerService.getCustomerDetails(customer.customerId);
          setDetails(data);
        } catch (err) {
          console.error('Failed to load customer details', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    } else {
      setDetails(null);
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const totalPaid = details ? details.totalPaid : customer.totalPaid || 0;
  const totalDebt = details ? details.totalDebt : customer.totalDebt || 0;
  const ordersCount = details ? details.ordersCount : customer.ordersCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-card border border-border/40 rounded-3xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/30 flex justify-between items-center bg-secondary/15">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white font-black text-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              {getInitials(customer.fullName || 'Customer')}
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                {customer.fullName || 'Unnamed Customer'}
                <span className="text-xs font-mono font-bold text-foreground/45 bg-secondary/40 border border-border/20 px-2 py-0.5 rounded-lg">
                  #{customer.customerId}
                </span>
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-foreground/50">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 divide-x divide-border/20 border-b border-border/20 bg-card">
          <div className="p-4 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/40 block">Total Orders</span>
            <span className="text-xl font-black text-foreground mt-0.5 block tracking-tight">{ordersCount}</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/40 block">Total Paid</span>
            <span className="text-xl font-black text-success mt-0.5 block tracking-tight">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/40 block">Debt Balance</span>
            <span className={`text-xl font-black mt-0.5 block tracking-tight ${totalDebt > 0 ? 'text-destructive' : 'text-foreground/40'}`}>
              ${totalDebt.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/20 px-6 bg-secondary/5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/50 hover:text-foreground'
            }`}
          >
            Recent Orders ({details?.orders?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-3 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer ${
              activeTab === 'purchases'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/50 hover:text-foreground'
            }`}
          >
            Top Medicines ({customer.purchases?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/50 hover:text-foreground'
            }`}
          >
            Payment Repayments ({details?.customerPayments?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-bold text-foreground/40">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-2" />
              Loading customer timeline...
            </div>
          ) : (
            <>
              {/* 1. Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  {!details?.orders || details.orders.length === 0 ? (
                    <div className="text-center py-12 text-xs text-foreground/40 font-semibold">
                      No order history found for this customer.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border/20 text-[10px] uppercase tracking-wider text-foreground/45 font-bold">
                            <th className="py-2.5 px-3">Receipt #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Total</th>
                            <th className="py-2.5 px-3">Paid</th>
                            <th className="py-2.5 px-3">Balance</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {details.orders.map((o: any) => (
                            <tr key={o.orderId} className="hover:bg-secondary/10 transition-colors">
                              <td className="py-3 px-3 text-xs font-mono font-bold text-primary">
                                {o.receiptNumber}
                              </td>
                              <td className="py-3 px-3 text-xs text-foreground/75 font-semibold">
                                {new Date(o.orderDate).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3 text-xs font-extrabold text-foreground">
                                ${Number(o.totalAmount || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-xs font-semibold text-success">
                                ${Number(o.paidAmount || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-xs font-semibold text-destructive">
                                ${Number(o.balanceDue || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  o.paymentStatus === 'PAID'
                                    ? 'bg-success/10 text-success'
                                    : o.paymentStatus === 'PARTIAL'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-destructive/10 text-destructive'
                                }`}>
                                  {o.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Top Medicines Tab */}
              {activeTab === 'purchases' && (
                <div>
                  {!customer.purchases || customer.purchases.length === 0 ? (
                    <div className="text-center py-12 text-xs text-foreground/40 font-semibold">
                      No purchase details recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customer.purchases.map((p, idx) => (
                        <div key={idx} className="p-3.5 bg-secondary/10 border border-border/20 rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold text-foreground block">{p.productName}</span>
                            <span className="text-[10px] text-foreground/50 font-semibold mt-0.5 block">Quantity bought: {p.quantity} units</span>
                          </div>
                          <span className="text-xs font-black text-primary">${Number(p.totalSpent || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Payments Ledger Tab */}
              {activeTab === 'payments' && (
                <div>
                  {!details?.customerPayments || details.customerPayments.length === 0 ? (
                    <div className="text-center py-12 text-xs text-foreground/40 font-semibold">
                      No debt repayment entries recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border/20 text-[10px] uppercase tracking-wider text-foreground/45 font-bold">
                            <th className="py-2.5 px-3">Payment #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3 text-right">Amount Repaid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {details.customerPayments.map((pay: any) => (
                            <tr key={pay.paymentId} className="hover:bg-secondary/10 transition-colors">
                              <td className="py-3 px-3 text-xs font-mono font-bold text-foreground/75">
                                {pay.paymentNumber}
                              </td>
                              <td className="py-3 px-3 text-xs text-foreground/75 font-semibold">
                                {new Date(pay.paymentDate).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3 text-xs text-foreground/60 font-semibold">
                                {pay.paymentMethod}
                              </td>
                              <td className="py-3 px-3 text-xs font-black text-success text-right">
                                +${Number(pay.amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/20 bg-secondary/15 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-extrabold transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
