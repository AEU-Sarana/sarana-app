'use client';

import React from 'react';
import { CartItem } from './cart-item-row';

interface PaymentSummaryProps {
  cart: CartItem[];
  discountValue: string;
  onDiscountValueChange: (val: string) => void;
  paymentMethod: 'CASH' | 'ABA' | 'WING';
  onPaymentMethodChange: (method: 'CASH' | 'ABA' | 'WING') => void;
  cashReceived: string;
  onCashReceivedChange: (val: string) => void;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  changeAmount: number;
  onClearCart: () => void;
  onCheckout: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export default function PaymentSummary({
  cart,
  discountValue,
  onDiscountValueChange,
  paymentMethod,
  onPaymentMethodChange,
  cashReceived,
  onCashReceivedChange,
  subtotal,
  discountAmount,
  grandTotal,
  changeAmount,
  onClearCart,
  onCheckout,
  isLoading = false,
}: PaymentSummaryProps) {
  return (
    <>
      {/* Pricing Calculations & Discounts */}
      <div className="border-t border-border/40 pt-4 space-y-4 shrink-0 select-none">
        
        {/* Discount Deduction Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/50">
              Discount Deduction ($)
            </label>
            {parseFloat(discountValue) > 0 && (
              <button
                type="button"
                onClick={() => onDiscountValueChange('0')}
                className="text-[10px] font-bold text-destructive hover:underline cursor-pointer focus:outline-none"
              >
                Clear
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter amount (e.g. 5.00)"
              value={discountValue === '0' ? '' : discountValue}
              onChange={(e) => {
                const val = e.target.value;
                // Allow numbers and a single decimal point
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  onDiscountValueChange(val);
                }
              }}
              className="w-full pl-7 pr-4 py-2 text-xs rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 font-semibold focus:ring-2 focus:ring-primary/5 outline-none transition-all"
            />
            <div className="absolute left-3 top-2 text-xs font-bold text-foreground/45 select-none">
              $
            </div>
          </div>
        </div>

        {/* Calculations Breakdown */}
        <div className="bg-secondary/15 dark:bg-secondary/5 border border-border/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold text-foreground/60">
            <span>Subtotal:</span>
            <span className="text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-foreground/60">
            <span>Discount:</span>
            <span className="text-destructive">-${discountAmount.toFixed(2)}</span>
          </div>
          <div className="h-[1px] bg-border/40 my-1" />
          <div className="flex justify-between items-center text-sm font-black text-foreground">
            <span className="text-xs font-black uppercase tracking-wider text-foreground/60">Grand Total:</span>
            <span className="text-primary text-base tracking-tight">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Block */}
      <div className="space-y-3 shrink-0 select-none border-t border-border/40 pt-4">
        <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/50">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'CASH', label: 'Cash Pay' },
            { id: 'ABA', label: 'ABA Pay' },
            { id: 'WING', label: 'Wing Pay' }
          ].map((pm) => {
            const isSelected = paymentMethod === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => onPaymentMethodChange(pm.id as 'CASH' | 'ABA' | 'WING')}
                className={`py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary/5 text-primary border-primary border-2 shadow-sm font-black'
                    : 'bg-card text-foreground/75 border-border/60 hover:bg-secondary/40'
                }`}
              >
                <span>{pm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cash Received input (Cash calculations) */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-2.5 animate-scale-up pt-1">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                  Cash Received ($)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50.00"
                  value={cashReceived}
                  onChange={(e) => onCashReceivedChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-card font-semibold focus:border-primary outline-none"
                />
              </div>
              <div className="w-24 text-right self-end pb-1 select-none">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-foreground/50 mb-1">
                  Change return
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ${changeAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Place order CTA Button */}
      <div className="pt-2 shrink-0 select-none">
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="w-full text-center text-[10px] font-black text-destructive hover:underline cursor-pointer mb-3 py-1 focus:outline-none"
          >
            Clear Cart & Reset POS
          </button>
        )}
        
        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || isLoading}
          className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary/20 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Processing Checkout...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Complete Transaction (${grandTotal.toFixed(2)})</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
