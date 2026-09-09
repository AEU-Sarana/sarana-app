'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { saleService } from '../../../services/saleService';
import { Order } from '../../../features/sale/types';
import OrderDetailModal from '../../../components/sales/order-detail-modal';
import { useLanguage } from '../../../contexts/language-context';

export default function AdminCancellationsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Selected Order for viewing receipt details
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Approval Modal State
  const [approvingOrder, setApprovingOrder] = useState<Order | null>(null);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Rejection Modal State
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await saleService.listCancellationRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch pending cancellation requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenApproveModal = (order: Order) => {
    setApprovingOrder(order);
    setError(null);
  };

  const handleConfirmApprove = async () => {
    if (!approvingOrder) return;

    setIsSubmittingApprove(true);
    setError(null);
    setActionSuccessMsg(null);

    try {
      await saleService.approveCancellation(approvingOrder.order_id);
      setActionSuccessMsg(`Successfully approved cancellation for Order #${approvingOrder.receipt_number}. Stock items restocked.`);
      setApprovingOrder(null);
      await fetchRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to approve cancellation.');
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleOpenRejectModal = (order: Order) => {
    setRejectingOrder(order);
    setRejectionReason('');
    setError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;

    setIsSubmittingReject(true);
    setError(null);

    try {
      await saleService.rejectCancellation(rejectingOrder.order_id, rejectionReason.trim());
      setActionSuccessMsg(`Cancellation request for Order #${rejectingOrder.receipt_number} has been rejected.`);
      setRejectingOrder(null);
      setRejectionReason('');
      await fetchRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reject cancellation request.');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const formatUSD = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/40 rounded-3xl p-6 shadow-sm select-none">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Order Cancellation Requests</h2>
          <p className="text-xs text-foreground/50 mt-1 font-medium">
            Review, approve, or reject cashier order cancellation requests. Approving will automatically restock items into inventory.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          disabled={isLoading}
          className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border/40 text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Queue
        </button>
      </div>

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center justify-between animate-fade-in">
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-foreground/50 hover:text-foreground text-sm cursor-pointer">&times;</button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-2xl flex items-center justify-between animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-foreground/50 hover:text-foreground text-sm cursor-pointer">&times;</button>
        </div>
      )}

      {/* Content Table */}
      <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden select-none">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs font-bold text-foreground/45">Loading pending cancellation requests...</p>
          </div>
        )}

        {!isLoading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-foreground/75">No pending cancellation requests</p>
            <p className="text-xs text-foreground/40 font-semibold">All cashier orders are clean and up to date.</p>
          </div>
        )}

        {!isLoading && requests.length > 0 && (
          <>
            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-border/10 p-4 space-y-4">
              {requests.map((order) => (
                <div key={order.order_id} className="pt-4 first:pt-0 space-y-3 select-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-primary block">
                        {order.receipt_number}
                      </span>
                      <span className="text-[10px] text-foreground/50 font-semibold block mt-0.5">
                        Requested {new Date(order.order_date).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-base font-black text-foreground">{formatUSD(order.total_amount)}</span>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 p-2.5 rounded-xl text-xs font-semibold">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-600/70 mb-0.5">Reason:</span>
                    &quot;{order.cancel_reason || 'No reason specified'}&quot;
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/10 text-xs">
                    <span className="text-[10px] text-foreground/50 font-bold">
                      Cashier: {order.seller_name || `User #${order.seller_id}`}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.order_id);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-secondary/60 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(order)}
                        className="px-2.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(order)}
                        className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/15">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Receipt ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Order Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Cashier</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/45">Cancellation Reason</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">Total Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-foreground/45">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {requests.map((order) => (
                  <tr key={order.order_id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-foreground bg-secondary/40 border border-border/20 px-2.5 py-1 rounded-lg">
                        {order.receipt_number}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-foreground/75">
                      {new Date(order.order_date).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-foreground/75">
                      {order.seller_name || `User #${order.seller_id}`}
                    </td>

                    <td className="px-6 py-4">
                      <div className="max-w-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        &quot;{order.cancel_reason || 'No reason specified'}&quot;
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-black text-foreground">
                      {formatUSD(order.total_amount)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(order.order_id);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-secondary/60 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenApproveModal(order)}
                          className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(order)}
                          className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>

      {/* Order Detail Receipt Modal */}
      <OrderDetailModal
        isOpen={isDetailModalOpen}
        orderId={selectedOrderId}
        onClose={() => setIsDetailModalOpen(false)}
        onOrderUpdated={fetchRequests}
      />

      {/* Custom Approve Confirmation Modal */}
      {approvingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/60 shadow-2xl p-6 space-y-4 animate-scale-up relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-black text-foreground">Approve Order Cancellation</h4>
                <p className="text-xs text-foreground/60 mt-1">
                  Are you sure you want to approve cancellation for Order <span className="font-mono font-bold text-foreground bg-secondary/40 px-1.5 py-0.5 rounded">{approvingOrder.receipt_number}</span>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-secondary/20 border border-border/30 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-foreground/70 font-semibold">
                <span>Total Amount:</span>
                <span className="font-bold text-foreground">{formatUSD(approvingOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between text-foreground/70 font-semibold">
                <span>Requested Reason:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400 max-w-[200px] truncate">&quot;{approvingOrder.cancel_reason}&quot;</span>
              </div>
              <div className="border-t border-border/20 pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Stock items will be automatically returned to inventory.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                disabled={isSubmittingApprove}
                className="px-4 py-2 border border-border text-xs font-bold text-foreground/70 hover:bg-secondary/40 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isSubmittingApprove}
                className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isSubmittingApprove ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Rejection Confirmation Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/60 shadow-2xl p-6 space-y-4 animate-scale-up relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-black text-foreground">Reject Cancellation Request</h4>
                <p className="text-xs text-foreground/60 mt-1">
                  Rejecting this request will restore Order <span className="font-mono font-bold text-foreground bg-secondary/40 px-1.5 py-0.5 rounded">{rejectingOrder.receipt_number}</span> to COMPLETED status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Transaction verified, customer already left with items"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-secondary/10 text-xs font-semibold text-foreground focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  disabled={isSubmittingReject}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground/70 hover:bg-secondary/40 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
