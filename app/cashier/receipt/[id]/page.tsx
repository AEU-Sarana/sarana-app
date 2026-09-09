'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saleService } from '../../../../services/saleService';
import { printReceipt } from '../../../../libs/printReceipt';

// Approximate KHR per USD exchange rate
const KHR_RATE = 4100;

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount?: number;
}

interface MockOrder {
  receipt_number: string;
  order_date: string;
  seller_name: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_fee: number;
  total_amount: number;
  payment_method: string;
  received_amount: number;
  change_amount: number;
}

const MOCK_RECEIPTS_DB: Record<string, MockOrder> = {
  'RCP-20260603-028': {
    receipt_number: 'RCP-20260603-028',
    order_date: '2026-06-03 14:14:00',
    seller_name: 'Cashier One',
    customer_name: 'Walk-in Customer',
    customer_phone: 'N/A',
    items: [
      { product_name: 'Amoxicillin 500mg', quantity: 2, unit_price: 5.00, subtotal: 10.00 },
      { product_name: 'Paracetamol 500mg', quantity: 3, unit_price: 1.50, subtotal: 4.50 },
      { product_name: 'Vitamin C 1000mg', quantity: 1, unit_price: 4.00, subtotal: 4.00 },
    ],
    subtotal: 18.50,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 18.50,
    payment_method: 'ABA',
    received_amount: 18.50,
    change_amount: 0.00,
  },
  'RCP-20260603-027': {
    receipt_number: 'RCP-20260603-027',
    order_date: '2026-06-03 13:45:00',
    seller_name: 'Cashier One',
    customer_name: 'Sok Chan',
    customer_phone: '012 888 999',
    items: [
      { product_name: 'Ibuprofen 400mg', quantity: 4, unit_price: 3.50, subtotal: 14.00 },
      { product_name: 'Cough Syrup (Guaifenesin)', quantity: 1, unit_price: 6.00, subtotal: 6.00 },
    ],
    subtotal: 20.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 20.00,
    payment_method: 'CASH',
    received_amount: 20.00,
    change_amount: 0.00,
  },
  'RCP-20260603-026': {
    receipt_number: 'RCP-20260603-026',
    order_date: '2026-06-03 12:30:00',
    seller_name: 'Cashier One',
    customer_name: 'Dara Sok',
    customer_phone: '099 222 333',
    items: [
      { product_name: 'Cetirizine 10mg (Allergy)', quantity: 2, unit_price: 5.00, subtotal: 10.00 },
    ],
    subtotal: 10.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 10.00,
    payment_method: 'ABA',
    received_amount: 10.00,
    change_amount: 0.00,
  },
  'RCP-20260603-025': {
    receipt_number: 'RCP-20260603-025',
    order_date: '2026-06-03 11:15:00',
    seller_name: 'Cashier One',
    customer_name: 'Walk-in Customer',
    customer_phone: 'N/A',
    items: [
      { product_name: 'Bandages Sterile (Pack)', quantity: 1, unit_price: 2.25, subtotal: 2.25 },
      { product_name: 'Alcohol Spray 70%', quantity: 1, unit_price: 3.00, subtotal: 3.00 },
    ],
    subtotal: 5.25,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 5.25,
    payment_method: 'CASH',
    received_amount: 10.00,
    change_amount: 4.75,
  },
  'RCP-20260603-024': {
    receipt_number: 'RCP-20260603-024',
    order_date: '2026-06-03 10:02:00',
    seller_name: 'Cashier One',
    customer_name: 'Sopheap Heng',
    customer_phone: '015 777 555',
    items: [
      { product_name: 'Atorvastatin 20mg (Cholesterol)', quantity: 1, unit_price: 15.00, subtotal: 15.00 },
      { product_name: 'Metformin 500mg (Diabetes)', quantity: 2, unit_price: 8.00, subtotal: 16.00 },
    ],
    subtotal: 31.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 31.00,
    payment_method: 'ABA',
    received_amount: 31.00,
    change_amount: 0.00,
  },
  'RCP-20260603-023': {
    receipt_number: 'RCP-20260603-023',
    order_date: '2026-06-03 09:12:00',
    seller_name: 'Cashier One',
    customer_name: 'Walk-in Customer',
    customer_phone: 'N/A',
    items: [
      { product_name: 'Aspirin 81mg', quantity: 2, unit_price: 4.00, subtotal: 8.00 },
      { product_name: 'Multivitamin Formula', quantity: 1, unit_price: 4.45, subtotal: 4.45 },
    ],
    subtotal: 12.45,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 12.45,
    payment_method: 'CASH',
    received_amount: 20.00,
    change_amount: 7.55,
  },
  'RCP-20260603-022': {
    receipt_number: 'RCP-20260603-022',
    order_date: '2026-06-03 08:45:00',
    seller_name: 'Cashier One',
    customer_name: 'Sokheng Sok',
    customer_phone: '088 111 222',
    items: [
      { product_name: 'Omeprazole 20mg (Acid Reflux)', quantity: 2, unit_price: 10.00, subtotal: 20.00 },
    ],
    subtotal: 20.00,
    discount_amount: 0.00,
    tax_amount: 0.00,
    service_fee: 0.00,
    total_amount: 20.00,
    payment_method: 'WING',
    received_amount: 20.00,
    change_amount: 0.00,
  },
};

interface PageProps {
  params: { id: string };
}

export default function CashierReceiptPage({ params }: PageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReceipt() {
      setIsLoading(true);
      setError(null);
      const receiptId = params.id;

      if (MOCK_RECEIPTS_DB[receiptId]) {
        setOrder(MOCK_RECEIPTS_DB[receiptId]);
        setIsLoading(false);
        return;
      }

      const numericId = Number(receiptId);
      if (!isNaN(numericId) && numericId > 0) {
        try {
          const apiOrder = (await saleService.getOrder(numericId)) as any;
          const itemsSubtotal = (apiOrder.items || []).reduce(
            (s: number, i: { subtotal: number }) => s + i.subtotal,
            0,
          );
          setOrder({
            receipt_number: apiOrder.receipt_number,
            order_date: new Date(apiOrder.order_date).toLocaleString(),
            seller_name: apiOrder.seller_name || 'Cashier',
            customer_name: apiOrder.customer_name || 'Walk-in Customer',
            customer_phone: apiOrder.customer_phone || 'N/A',
            items: (apiOrder.items || []).map((item: {
              product_name?: string;
              product_id?: number;
              quantity: number;
              unit_price: number;
              subtotal: number;
              discount_amount?: number;
            }) => ({
              product_name: item.product_name || `Product ID: ${item.product_id}`,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              discount_amount: item.discount_amount,
            })),
            subtotal: itemsSubtotal,
            discount_amount: apiOrder.discount_amount || 0,
            tax_amount: apiOrder.tax_amount || 0,
            service_fee: apiOrder.service_fee || 0,
            total_amount: apiOrder.total_amount,
            payment_method: apiOrder.payment_method,
            received_amount: apiOrder.received_amount || apiOrder.total_amount,
            change_amount: Math.max(
              0,
              (apiOrder.received_amount || apiOrder.total_amount) - apiOrder.total_amount,
            ),
          });
        } catch (err) {
          console.error('Failed to load order from API:', err);
          setError('Receipt not found. Showing a template invoice.');
          setOrder({
            receipt_number: receiptId,
            order_date: new Date().toLocaleString(),
            seller_name: 'Cashier One',
            customer_name: 'Walk-in Customer',
            customer_phone: 'N/A',
            items: [
              { product_name: 'Aspirin 100mg', quantity: 2, unit_price: 3.50, subtotal: 7.00 },
              { product_name: 'Paracetamol 500mg', quantity: 5, unit_price: 1.20, subtotal: 6.00 },
            ],
            subtotal: 13.00,
            discount_amount: 0.00,
            tax_amount: 0.00,
            service_fee: 0.00,
            total_amount: 13.00,
            payment_method: 'CASH',
            received_amount: 20.00,
            change_amount: 7.00,
          });
        }
      } else {
        setOrder({
          receipt_number: receiptId,
          order_date: new Date().toLocaleString(),
          seller_name: 'Cashier One',
          customer_name: 'Walk-in Customer',
          customer_phone: 'N/A',
          items: [
            { product_name: 'Aspirin 100mg', quantity: 2, unit_price: 3.50, subtotal: 7.00 },
            { product_name: 'Paracetamol 500mg', quantity: 5, unit_price: 1.20, subtotal: 6.00 },
          ],
          subtotal: 13.00,
          discount_amount: 0.00,
          tax_amount: 0.00,
          service_fee: 0.00,
          total_amount: 13.00,
          payment_method: 'CASH',
          received_amount: 20.00,
          change_amount: 7.00,
        });
      }
      setIsLoading(false);
    }

    loadReceipt();
  }, [params.id]);

  const handlePrint = () => {
    if (!order) return;

    printReceipt({
      receipt_number: order.receipt_number,
      order_date: order.order_date,
      seller_name: order.seller_name,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      payment_method: order.payment_method,
      items: order.items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        discount_amount: item.discount_amount
      })),
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      service_fee: order.service_fee,
      total_amount: order.total_amount,
      received_amount: order.received_amount,
      change_amount: order.change_amount,
      exchange_rate: KHR_RATE
    });
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-bold text-foreground/50 tracking-wider">Fetching Invoice Detail...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-card border border-border/40 rounded-3xl p-12 text-center shadow-sm select-none max-w-md mx-auto mt-12">
        <h3 className="text-base font-black text-foreground">Order Details Missing</h3>
        <p className="text-xs text-foreground/50 mt-1">We could not pull details for this transaction receipt.</p>
        <Link href="/cashier/dashboard" className="mt-6 inline-block px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const totalKHR = Math.round(order.total_amount * KHR_RATE).toLocaleString();
  const isCash = order.payment_method === 'CASH' || order.payment_method === 'Cash';

  return (
    <div className="relative max-w-lg mx-auto pb-12">

      {/* ── Screen-only chrome: back button + title ── */}
      <div className="no-print flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="px-4 py-2.5 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          <svg className="w-4 h-4 text-foreground/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <h1 className="text-lg font-black text-foreground tracking-tight">Receipt Details</h1>
        <div className="w-16" />
      </div>

      {error && (
        <div className="no-print mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center text-[10px] font-bold text-amber-600 dark:text-amber-400">
          {error}
        </div>
      )}

      {/* ── Card wrapper (screen decoration only, stripped in print) ── */}
      <div className="receipt-card-wrapper bg-card border border-border/40 rounded-3xl shadow-xl p-6 relative flex flex-col">

        {/*
          ═══════════════════════════════════════════════════
          #printable-receipt-content
          THIS is the only element shown when printing.
          Its on-screen look = exact print output.
          ═══════════════════════════════════════════════════
        */}
        <div
          id="printable-receipt-content"
          className="font-mono text-xs text-black bg-white p-6 border border-dashed border-gray-300 rounded-2xl space-y-4 shadow-sm"
        >

          {/* ── HEADER: logo left / pharmacy name + invoice right ── */}
          <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-4">

            {/* Left: logo (in fixed-size wrapper) + phone */}
            <div className="flex flex-col items-start gap-1.5 shrink-0 w-[38%]">
              {/* Wrapper div enforces logo size in both screen and print */}
              <div
                className="receipt-logo-box"
                style={{
                  width: '72px',
                  height: '72px',
                  minWidth: '72px',
                  maxWidth: '72px',
                  minHeight: '72px',
                  maxHeight: '72px',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpg"
                  alt="Pharmacy Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span className="text-[9px] font-bold text-gray-700 leading-snug">
                ទូរស័ព្ទ: 017 62 26 26
              </span>
            </div>

            {/* Right: bilingual pharmacy + invoice label */}
            <div className="flex flex-col items-end justify-center flex-1 pl-4 gap-0.5">
              <span className="text-[14px] font-black text-black leading-tight">ឱសថស្ថាន</span>
              <span className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest">PHARMACIE</span>
              <span className="text-[15px] font-black text-black leading-tight mt-1.5">វិក្កយបត្រ</span>
              <span className="text-[11px] font-black text-black uppercase tracking-widest">INVOICE</span>
            </div>
          </div>

          {/* ── METADATA ── */}
          <div className="space-y-1.5 text-[9.5px] text-gray-600 border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between">
              <span>Receipt ID:</span>
              <span className="font-black text-black">{order.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{order.order_date}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="capitalize">{order.seller_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-black text-black">{order.customer_name}</span>
            </div>
            {order.customer_phone !== 'N/A' && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{order.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-black text-black">{order.payment_method}</span>
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <table className="w-full text-left border-collapse text-black">
            <thead>
              <tr className="border-b border-dashed border-gray-400 text-gray-500 uppercase font-black" style={{ fontSize: 7.5 }}>
                <th className="pb-2 w-[7%]">ល.រ<br />N°</th>
                <th className="pb-2 pl-1.5 w-[46%]">រាយនាមទំនិញ<br />NAME OF GOODS</th>
                <th className="pb-2 text-center w-[10%]">ចំនួន<br />QTY</th>
                <th className="pb-2 text-right w-[17%]">តម្លៃមួយ<br />U.PRICE</th>
                <th className="pb-2 text-right w-[20%]">តម្លៃសរុប<br />AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dashed border-gray-100 last:border-0 align-top">
                  <td className="py-1.5 text-[9px]">{idx + 1}</td>
                  <td className="py-1.5 pl-1.5 text-[9px]">
                    <div className="font-bold">{item.product_name}</div>
                    {item.discount_amount && item.discount_amount > 0 && (
                      <div className="text-green-600 font-bold" style={{ fontSize: 7.5 }}>
                        Disc: -${item.discount_amount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 text-center text-[9px]">{item.quantity}</td>
                  <td className="py-1.5 text-right text-[9px]">${item.unit_price.toFixed(2)}</td>
                  <td className="py-1.5 text-right text-[9px] font-bold">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-b border-dashed border-gray-300" />

          {/* ── TOTALS ── */}
          <div className="space-y-1.5 text-[9.5px]">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Discount:</span>
                <span>-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
            )}
            {order.service_fee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service Fee:</span>
                <span>${order.service_fee.toFixed(2)}</span>
              </div>
            )}
            {/* TOTAL box */}
            <div className="receipt-total-box flex justify-between items-center border-2 border-black p-2.5 mt-2">
              <span className="text-[11px] font-black uppercase text-black">សរុប TOTAL</span>
              <div className="text-right">
                <div className="text-[16px] font-black text-black tracking-tight">
                  ${order.total_amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-300" />

          {/* ── PAYMENT ── */}
          <div className="space-y-1.5 text-[9.5px]">
            {isCash ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Paid:</span>
                  <span>${order.received_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-black border-t border-gray-100 pt-1.5 text-[10px]">
                  <span>Change returned:</span>
                  <span>${order.change_amount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>{order.payment_method} PAID:</span>
                <span>Reference synced ✓</span>
              </div>
            )}
          </div>

          {/* ── SIGNATURES ── */}
          <div className="pt-3">
            <div className="flex justify-between text-[8.5px] font-bold text-gray-800 px-1">
              <span>អ្នកទិញ / L'acheteur</span>
              <span>អ្នកលក់ / Le vender</span>
            </div>
            <div className="h-6" />
            <div className="border-t border-dashed border-gray-300 mt-1 pb-2" />
          </div>

          {/* ── FOOTER ── */}
          <div className="text-center space-y-1.5">
            <p className="text-[9.5px] font-black uppercase tracking-widest text-black">
              THANK YOU FOR YOUR PURCHASE!
            </p>
            <p className="text-[7.5px] text-gray-400">
              Medicines are non-refundable once opened. Please check expiry dates.
            </p>
          </div>

        </div>
        {/* End #printable-receipt-content */}

      </div>
      {/* End card wrapper */}

      {/* ── Print button (screen only — hidden when printing) ── */}
      <div className="no-print mt-6 flex gap-3 select-none">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-3 bg-secondary/80 hover:bg-secondary dark:bg-secondary/15 dark:hover:bg-secondary/25 border border-border/40 hover:border-border/80 rounded-xl text-foreground font-extrabold text-xs transition-all duration-150 hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0 text-foreground/55" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Receipt</span>
        </button>
      </div>

    </div>
  );
}
