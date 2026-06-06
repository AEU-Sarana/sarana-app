'use client';

import React from 'react';
import { Product } from '../../features/product/types';
import { printReceipt } from '../../libs/printReceipt';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CompletedOrder {
  receiptId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cashReceived: number;
  change: number;
  customerName: string;
  customerPhone: string;
  cashierName: string;
  dateString: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  order: CompletedOrder | null;
  paymentMethod: 'CASH' | 'ABA' | 'WING';
  onClose: () => void;
  onNewOrder: () => void;
}

export default function ReceiptModal({
  isOpen,
  order,
  paymentMethod,
  onClose,
  onNewOrder,
}: ReceiptModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (!order) return;

    printReceipt({
      receipt_number: order.receiptId,
      order_date: order.dateString,
      seller_name: order.cashierName,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      payment_method: paymentMethod,
      items: order.items.map(item => ({
        product_name: item.product.product_name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
        discount_amount: 0
      })),
      subtotal: order.subtotal,
      discount_amount: order.discount,
      tax_amount: order.tax,
      service_fee: 0,
      total_amount: order.total,
      received_amount: order.cashReceived,
      change_amount: order.change,
      exchange_rate: 4100
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none p-4">
      <div
        id="printable-receipt-modal"
        className="w-full max-w-sm bg-card border border-border/80 rounded-3xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Modal close indicator (no-print) */}
        <button
          onClick={onClose}
          title="Close Receipt"
          className="no-print absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-secondary/80 transition-all duration-150 cursor-pointer"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Skeuomorphic Thermal Receipt Wrapper */}
        <div id="printable-receipt-content" className="font-mono text-xs text-black bg-white p-4 border border-dashed border-gray-300 rounded-xl space-y-4">
          
          {/* Header Pharmacy Logo & Bilingual Labels */}
          <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-3">
            <div className="flex flex-col items-start space-y-1 w-[40%] shrink-0">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  maxWidth: '48px',
                  minHeight: '48px',
                  maxHeight: '48px',
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

          {/* Receipt metadata */}
          <div className="space-y-1 text-[9px] text-gray-600">
            <div className="flex justify-between">
              <span>Receipt ID:</span>
              <span className="font-bold">{order.receiptId}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{order.dateString}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="capitalize">{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{order.customerPhone}</span>
            </div>
            <div className="border-b border-dashed border-gray-300 pt-2" />
          </div>

          {/* Invoice list items table */}
          <table className="w-full text-left text-[9px] border-collapse text-black">
            <thead>
              <tr className="border-b border-dashed border-gray-300 text-gray-500 uppercase text-[7px] font-bold">
                <th className="pb-1.5 w-[8%]">ល.រ<br/>N°</th>
                <th className="pb-1.5 pl-1 w-[47%]">រាយនាមទំនិញ<br/>Name of Goods</th>
                <th className="pb-1.5 text-center w-[12%]">ចំនួន<br/>Qty</th>
                <th className="pb-1.5 text-right w-[15%]">តម្លៃមួយ<br/>U.Price</th>
                <th className="pb-1.5 text-right w-[18%]">តម្លៃសរុប<br/>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="align-top border-b border-dashed border-gray-100 last:border-0">
                  <td className="py-1.5 text-left">{idx + 1}</td>
                  <td className="py-1.5 pl-1 max-w-[130px] truncate">{item.product.product_name}</td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">${item.product.price.toFixed(2)}</td>
                  <td className="py-1.5 text-right">${(item.product.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-b border-dashed border-gray-300" />

          {/* Pricing Totals */}
          <div className="space-y-1.5 text-[10px] text-black">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-black border border-black p-2 mt-2">
              <span className="text-[10px] uppercase text-black font-extrabold">សរុប TOTAL</span>
              <span className="text-sm text-black tracking-tight">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-300" />

          {/* Payment Details */}
          <div className="space-y-1 text-[9px] text-gray-600">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-black">{paymentMethod}</span>
            </div>
            {paymentMethod === 'CASH' ? (
              <>
                <div className="flex justify-between">
                  <span>Cash Paid:</span>
                  <span>${order.cashReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-black border-t border-gray-100 pt-1 text-[10px]">
                  <span>Change returned:</span>
                  <span>${order.change.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>ABA / WING:</span>
                <span>PAID - reference sync</span>
              </div>
            )}
          </div>

          {/* Mock QR payment code if ABA Pay is selected */}
          {(paymentMethod === 'ABA' || paymentMethod === 'WING') && (
            <div className="pt-2 flex flex-col items-center justify-center space-y-1 select-none">
              {/* Fake ABA Pay QR container */}
              <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-lg p-1.5 flex items-center justify-center relative">
                {/* Simulated QR lines/dots */}
                <div className="w-full h-full opacity-70 flex flex-col justify-between">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex justify-between gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <div
                          key={j}
                          className={`w-3 h-3 rounded-[1px] ${
                            (i + j) % 2 === 0 || (i === 1 && j === 1) || (i === 1 && j === 6) || (i === 6 && j === 1) || (i === 6 && j === 6)
                              ? 'bg-indigo-900'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Tiny bank logo inside fake QR */}
                <div className="absolute inset-0 m-auto w-7 h-7 rounded bg-white shadow-sm border border-gray-100 flex items-center justify-center font-black text-[7px] text-indigo-700 select-none">
                  {paymentMethod}
                </div>
              </div>
              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Scan to Verify Transaction</span>
            </div>
          )}

          {/* Signatures & Footer message */}
          <div className="space-y-4 pt-3 select-none text-black">
            <div className="flex justify-between text-[8px] font-bold text-gray-800 px-1 pt-1">
              <span>អ្នកទិញ / L'acheteur</span>
              <span>អ្នកលក់ / Le vender</span>
            </div>
            <div className="h-4" /> {/* space for signature */}
            <div className="border-t border-dashed border-gray-300 pb-2" />
            <div className="text-center space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider">Thank you for your purchase!</p>
              <p className="text-[7px] text-gray-400">Medicines are non-refundable once opened. Please check expiry dates.</p>
            </div>
          </div>

        </div>

        {/* Receipt Modal Footer Actions (no-print) */}
        <div className="no-print mt-6 flex gap-3 shrink-0 select-none">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 bg-secondary/80 hover:bg-secondary dark:bg-secondary/15 dark:hover:bg-secondary/25 border border-border/40 hover:border-border/80 rounded-xl text-foreground font-extrabold text-xs transition-all duration-150 hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0 text-foreground/55" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.821V21h10.56v-7.179m-10.56 0A8.967 8.967 0 0112 18c2.435 0 4.64-1.026 6.22-2.679m-12.44 0a8.967 8.967 0 0012.44 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Print Receipt
          </button>
          
          <button
            type="button"
            onClick={onNewOrder}
            className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary/25 transition-all duration-150 hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            New Order
          </button>
        </div>

      </div>
    </div>
  );
}
