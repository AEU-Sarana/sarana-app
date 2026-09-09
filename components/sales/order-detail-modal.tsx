'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '../../features/sale/types';
import { saleService } from '../../services/saleService';
import { printReceipt } from '../../libs/printReceipt';

interface OrderDetailModalProps {
  isOpen: boolean;
  orderId: number | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export default function OrderDetailModal({
  isOpen,
  orderId,
  onClose,
  onOrderUpdated,
}: OrderDetailModalProps) {
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Request Form State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      const fetchDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const detail = await saleService.getOrder(orderId);
          setOrderDetail(detail);
        } catch (err: any) {
          setError(err?.message || 'Failed to fetch order details.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetail();
    } else {
      setOrderDetail(null);
      setIsCancelModalOpen(false);
      setCancelReason('');
      setCancelError(null);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const formatUSD = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatKHR = (n: number, rate: number = 4000) => {
    const khr = Math.round(n * rate);
    return `${khr.toLocaleString()} KHR`;
  };

  const handlePrint = () => {
    if (!orderDetail) return;

    printReceipt({
      receipt_number: orderDetail.receipt_number,
      order_date: new Date(orderDetail.order_date).toLocaleString(),
      seller_name: orderDetail.seller_name || `ID #${orderDetail.seller_id}`,
      customer_name: 'Walk-in Customer',
      payment_method: orderDetail.payment_method,
      items: (orderDetail.items || []).map(item => ({
        product_name: item.product_name || `Product #${item.product_id}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        discount_amount: item.discount_amount
      })),
      subtotal: orderDetail.total_amount + orderDetail.discount_amount - orderDetail.tax_amount - orderDetail.service_fee,
      discount_amount: orderDetail.discount_amount,
      tax_amount: orderDetail.tax_amount,
      service_fee: orderDetail.service_fee,
      total_amount: orderDetail.total_amount,
      received_amount: orderDetail.received_amount,
      change_amount: orderDetail.received_amount !== undefined ? Math.max(0, orderDetail.received_amount - orderDetail.total_amount) : undefined,
      exchange_rate: orderDetail.exchange_rate
    });
  };

  const handleSubmitCancellationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetail || !cancelReason.trim()) return;

    setIsSubmittingCancel(true);
    setCancelError(null);

    try {
      const updatedOrder = await saleService.requestCancellation(orderDetail.order_id, cancelReason.trim());
      setOrderDetail(updatedOrder);
      setIsCancelModalOpen(false);
      setCancelReason('');
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || err?.message || 'Failed to submit cancellation request.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const orderStatus = orderDetail?.order_status || 'COMPLETED';
  const canRequestCancel = orderStatus === 'COMPLETED' || (!orderDetail?.cancel_requested_at && !orderDetail?.cancelled_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-3xl border border-border/40 shadow-2xl overflow-hidden animate-scale-up select-none flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/40 bg-secondary/15 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-black text-foreground">Transaction Receipt</h3>
            <p className="text-[10px] text-foreground/45 mt-0.5">Order Details & Breakdown</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs font-bold text-foreground/45">Loading receipt data...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {!isLoading && !error && orderDetail && (
            <div className="space-y-6">

              {/* Status Banner */}
              {orderStatus === 'CANCEL_REQUESTED' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-700 dark:text-amber-300 text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Cancellation Request Pending Admin Approval
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Reason: &quot;{orderDetail.cancel_reason}&quot;
                  </p>
                  {orderDetail.cancel_requested_at && (
                    <p className="text-[10px] opacity-75">
                      Requested at: {new Date(orderDetail.cancel_requested_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {orderStatus === 'CANCELLED' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-700 dark:text-red-300 text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Order Cancelled & Refunded / Stock Restocked
                  </div>
                  {orderDetail.cancel_reason && (
                    <p className="text-[11px] text-red-700/80 dark:text-red-300/80">
                      Reason: &quot;{orderDetail.cancel_reason}&quot;
                    </p>
                  )}
                  {orderDetail.cancelled_at && (
                    <p className="text-[10px] opacity-75">
                      Cancelled on: {new Date(orderDetail.cancelled_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Receipt Visualizer (Printable Area) */}
              <div
                id="printable-receipt-area"
                className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 font-mono text-xs text-black max-w-md mx-auto shadow-inner relative overflow-hidden space-y-4"
              >
                {/* Visual jagged top edges */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-100 to-gray-50" />

                {/* Header Pharmacy Logo & Bilingual Labels */}
                <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-3">
                  <div className="flex flex-col items-start space-y-1 w-[40%] shrink-0">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        minWidth: '56px',
                        maxWidth: '56px',
                        minHeight: '56px',
                        maxHeight: '56px',
                        overflow: 'hidden',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        flexShrink: 0,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo.jpg"
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-gray-700 whitespace-nowrap pt-1">ទូរស័ព្ទ: 017 62 26 26</span>
                  </div>
                  <div className="text-right flex flex-col flex-1 pl-3 space-y-0.5 select-none">
                    <h2 className="text-[11px] font-bold text-black leading-tight">ឱសថស្ថាន</h2>
                    <h3 className="text-[9px] font-extrabold uppercase text-gray-700 tracking-wider">PHARMACIE</h3>
                    <h2 className="text-[12px] font-bold text-black tracking-tight pt-1.5">វិក្កយបត្រ</h2>
                    <h3 className="text-[10px] font-black text-black tracking-wide uppercase leading-tight">INVOICE</h3>
                  </div>
                </div>

                <div className="space-y-1 text-[9px] text-gray-600">
                  <div className="flex justify-between">
                    <span>Receipt ID:</span>
                    <span className="font-bold">{orderDetail.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date/Time:</span>
                    <span>{new Date(orderDetail.order_date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="capitalize">{orderDetail.seller_name || `ID #${orderDetail.seller_id}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">Walk-in Customer</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-black">{orderDetail.payment_method}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-300 pt-2" />
                </div>

                {/* Items */}
                <table className="w-full text-left text-[9px] border-collapse text-black">
                  <thead>
                    <tr className="border-b border-dashed border-gray-300 text-gray-500 uppercase text-[7px] font-bold">
                      <th className="pb-1.5 w-[8%]">ល.រ<br />N°</th>
                      <th className="pb-1.5 pl-1 w-[47%]">រាយនាមទំនិញ<br />Name of Goods</th>
                      <th className="pb-1.5 text-center w-[12%]">ចំនួន<br />Qty</th>
                      <th className="pb-1.5 text-right w-[15%]">តម្លៃមួយ<br />U.Price</th>
                      <th className="pb-1.5 text-right w-[18%]">តម្លៃសរុប<br />Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-gray-100">
                    {orderDetail.items?.map((item, idx) => (
                      <tr key={item.order_item_id} className="align-top">
                        <td className="py-1.5 text-left">{idx + 1}</td>
                        <td className="py-1.5 pl-1 max-w-[130px] truncate">
                          <p className="font-semibold text-black break-all">{item.product_name || `Product #${item.product_id}`}</p>
                          {item.discount_amount > 0 && (
                            <p className="text-[8px] text-emerald-600 font-bold">Disc: -{formatUSD(item.discount_amount)}</p>
                          )}
                        </td>
                        <td className="py-1.5 text-center">{item.quantity}</td>
                        <td className="py-1.5 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-bold">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-b border-dashed border-gray-300" />

                {/* Summary Calculations */}
                <div className="space-y-1.5 text-[10px] text-black">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatUSD(orderDetail.total_amount + orderDetail.discount_amount - orderDetail.tax_amount - orderDetail.service_fee)}</span>
                  </div>
                  {orderDetail.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatUSD(orderDetail.discount_amount)}</span>
                    </div>
                  )}
                  {orderDetail.tax_amount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax:</span>
                      <span>{formatUSD(orderDetail.tax_amount)}</span>
                    </div>
                  )}
                  {orderDetail.service_fee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Service Fee:</span>
                      <span>{formatUSD(orderDetail.service_fee)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-black border border-black p-2 mt-2">
                    <span className="text-[10px] uppercase text-black font-extrabold">សរុប TOTAL</span>
                    <div className="text-right select-all">
                      <span className="text-sm text-black tracking-tight block leading-tight">${orderDetail.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-gray-300 my-2" />

                  {orderDetail.received_amount !== undefined && (
                    <div className="space-y-1 text-[9px] text-gray-600 pt-1">
                      <div className="flex justify-between">
                        <span>Cash Paid:</span>
                        <span>{formatUSD(orderDetail.received_amount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-black border-t border-gray-100 pt-1 text-[10px]">
                        <span>Change returned:</span>
                        <span>
                          {formatUSD(Math.max(0, orderDetail.received_amount - orderDetail.total_amount))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Signatures & Footer message */}
                <div className="space-y-4 pt-3 select-none text-black">
                  <div className="flex justify-between text-[8px] font-bold text-gray-800 px-1 pt-1">
                    <span>អ្នកទិញ / L'acheteur</span>
                    <span>អ្នកលក់ / Le vender</span>
                  </div>
                  <div className="h-4" />
                  <div className="border-t border-dashed border-gray-300 pb-2" />
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider">Thank you for your purchase!</p>
                    <p className="text-[7px] text-gray-400">Medicines are non-refundable once opened. Please check expiry dates.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-secondary/15 flex justify-between items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !orderDetail}
              className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm shadow-primary/10 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>

            {canRequestCancel && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isLoading || !orderDetail}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5"
              >
                Request Cancellation
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border bg-card text-xs font-bold text-foreground/75 hover:text-foreground hover:bg-secondary/40 rounded-xl transition-all duration-150 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Cancellation Reason Modal Dialog */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/60 shadow-2xl p-6 space-y-4 animate-scale-up">
            <div>
              <h4 className="text-base font-black text-foreground">Request Order Cancellation</h4>
              <p className="text-xs text-foreground/50 mt-1">
                Submitting a cancellation request sends this order to Admin approval. Please state a detailed reason.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleSubmitCancellationRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/75 mb-1">
                  Cancellation Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer changed mind, wrong payment method, accidental order"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-secondary/10 text-xs font-semibold text-foreground focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground/70 hover:bg-secondary/40 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel || !cancelReason.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingCancel ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

