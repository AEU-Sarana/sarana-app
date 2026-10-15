'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from './customer-selector';
import { useLanguage } from '../../contexts/language-context';
import { paymentMethodService, PaymentMethod } from '../../services/paymentMethodService';

export interface PaymentData {
  payment_method: string;
  payment_type: 'PAID' | 'DEBT' | 'PARTIAL';
  initial_paid_amount: number;
  received_amount: number;
  received_usd: number;
  received_khr: number;
  change_usd: number;
  change_khr: number;
  reference_number: string;
  notes: string;
  customer_id?: number;
  payment_due_date?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  exchangeRate?: number;
  customers: Customer[];
  selectedCustomerId: string;
  onConfirmPayment: (data: PaymentData) => void;
  isProcessing: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  exchangeRate = 4000,
  customers,
  selectedCustomerId,
  onConfirmPayment,
  isProcessing,
}: PaymentModalProps) {
  const { t } = useLanguage();
  
  // Dynamic payment methods from backend
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [activeCode, setActiveCode] = useState<string>('CASH');

  // Cash Inputs
  const [receivedUsdStr, setReceivedUsdStr] = useState<string>('');
  const [receivedKhrStr, setReceivedKhrStr] = useState<string>('');

  // Transfer / Reference Inputs
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Debt Inputs
  const [debtCustomerId, setDebtCustomerId] = useState<string>(selectedCustomerId);
  const [initialDepositStr, setInitialDepositStr] = useState<string>('0');
  const [dueDateStr, setDueDateStr] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Load active payment methods when modal opens
  useEffect(() => {
    if (isOpen) {
      paymentMethodService
        .getPaymentMethods(false)
        .then((data) => {
          if (data && data.length > 0) {
            setMethods(data);
            const defaultMethod = data.find((m) => m.code === 'CASH') || data[0];
            if (defaultMethod) setActiveCode(defaultMethod.code);
          }
        })
        .catch(() => {
          // Fallback defaults if API fails
          setMethods([
            { paymentMethodId: 1, name: 'Cash', code: 'CASH', type: 'CASH', isActive: true, isSystem: true, displayOrder: 1 },
            { paymentMethodId: 2, name: 'ABA Bank', code: 'ABA', type: 'BANK_TRANSFER', isActive: true, isSystem: false, displayOrder: 2 },
            { paymentMethodId: 3, name: 'Wing Bank', code: 'WING', type: 'BANK_TRANSFER', isActive: true, isSystem: false, displayOrder: 3 },
          ]);
        });
    }
  }, [isOpen]);

  // Sync selected customer when modal opens
  useEffect(() => {
    setDebtCustomerId(selectedCustomerId);
  }, [selectedCustomerId, isOpen]);

  // Set default received amount to exact total when opening Cash modal
  const currentMethod = methods.find((m) => m.code === activeCode);
  const isCash = activeCode === 'CASH' || currentMethod?.type === 'CASH';

  useEffect(() => {
    if (isOpen && isCash && !receivedUsdStr && !receivedKhrStr) {
      setReceivedUsdStr(totalAmount.toString());
    }
  }, [isOpen, isCash, totalAmount]);

  if (!isOpen) return null;

  const totalKhr = totalAmount * exchangeRate;
  const receivedUsd = parseFloat(receivedUsdStr) || 0;
  const receivedKhr = parseFloat(receivedKhrStr) || 0;
  const totalReceivedInUsd = receivedUsd + receivedKhr / exchangeRate;

  const changeUsd = Math.max(0, totalReceivedInUsd - totalAmount);
  const changeKhr = Math.round(changeUsd * exchangeRate);

  const initialDeposit = parseFloat(initialDepositStr) || 0;
  const debtBalance = Math.max(0, totalAmount - initialDeposit);

  // Fast cash presets
  const fastCashPresets = [
    totalAmount,
    Math.ceil(totalAmount / 5) * 5 || 5,
    Math.ceil(totalAmount / 10) * 10 || 10,
    20,
    50,
    100,
  ].filter((v, i, self) => self.indexOf(v) === i && v >= totalAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let payment_type: 'PAID' | 'DEBT' | 'PARTIAL' = 'PAID';
    let initial_paid = totalAmount;
    let finalReceived = totalReceivedInUsd;
    let finalMethod = activeCode;
    let customer_id: number | undefined = undefined;

    if (debtCustomerId !== 'walk-in') {
      const parsedId = parseInt(debtCustomerId, 10);
      if (!isNaN(parsedId)) customer_id = parsedId;
    }

    if (activeCode === 'DEBT') {
      finalMethod = 'DEBT';
      if (initialDeposit <= 0) {
        payment_type = 'DEBT';
        initial_paid = 0;
        finalReceived = 0;
      } else {
        payment_type = 'PARTIAL';
        initial_paid = initialDeposit;
        finalReceived = initialDeposit;
      }
    } else if (isCash) {
      finalMethod = activeCode;
      initial_paid = totalAmount;
      finalReceived = Math.max(totalAmount, totalReceivedInUsd);
    } else {
      // Bank / QR / Card
      finalMethod = activeCode;
      initial_paid = totalAmount;
      finalReceived = totalAmount;
    }

    onConfirmPayment({
      payment_method: finalMethod,
      payment_type,
      initial_paid_amount: initial_paid,
      received_amount: finalReceived,
      received_usd: receivedUsd,
      received_khr: receivedKhr,
      change_usd: changeUsd,
      change_khr: changeKhr,
      reference_number: referenceNumber.trim(),
      notes: notes.trim(),
      customer_id,
      payment_due_date: activeCode === 'DEBT' ? dueDateStr : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-border/40 bg-secondary/30 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">
              {t('pos.complete_payment', 'Complete Payment')}
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">
              Select payment method & record transaction details
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Total Banner */}
        <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-primary tracking-wider">Total Due</div>
            <div className="text-2xl font-black text-primary">${totalAmount.toFixed(2)} USD</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-foreground/50">KHR Rate ({exchangeRate.toLocaleString()})</div>
            <div className="text-lg font-extrabold text-foreground/80">{totalKhr.toLocaleString()} ៛</div>
          </div>
        </div>

        {/* Dynamic Payment Method Selector Tabs */}
        <div className="p-3 bg-secondary/20 border-b border-border/30 flex items-center gap-1.5 overflow-x-auto select-none">
          {methods.map((m) => (
            <button
              key={m.code}
              type="button"
              onClick={() => setActiveCode(m.code)}
              className={`py-2.5 px-3.5 rounded-xl text-xs font-black transition-all text-center whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeCode === m.code
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-card hover:bg-secondary text-foreground/70 border border-border/40'
              }`}
            >
              {m.type === 'CASH' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              {m.type === 'BANK_TRANSFER' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              )}
              {m.type === 'CARD' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              {m.name}
            </button>
          ))}

          {/* Customer Debt / Store Credit Option */}
          <button
            type="button"
            onClick={() => setActiveCode('DEBT')}
            className={`py-2.5 px-3.5 rounded-xl text-xs font-black transition-all text-center whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCode === 'DEBT'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-card hover:bg-secondary text-foreground/70 border border-border/40'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Debt / Credit
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* --- CASH METHOD --- */}
          {isCash && activeCode !== 'DEBT' && (
            <div className="space-y-4">
              {/* Preset Quick Buttons */}
              <div>
                <label className="text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider mb-1.5 block">
                  Quick Cash Amount
                </label>
                <div className="flex flex-wrap gap-2">
                  {fastCashPresets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setReceivedUsdStr(amount.toString());
                        setReceivedKhrStr('');
                      }}
                      className="px-3.5 py-1.5 bg-secondary/60 hover:bg-secondary border border-border/40 hover:border-primary/40 text-foreground text-xs font-black rounded-xl transition-all cursor-pointer"
                    >
                      ${amount.toFixed(2)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setReceivedUsdStr('');
                      setReceivedKhrStr(totalKhr.toString());
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Exact KHR ({totalKhr.toLocaleString()} ៛)
                  </button>
                </div>
              </div>

              {/* Received USD & KHR inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Cash Received (USD $)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-foreground/40">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={receivedUsdStr}
                      onChange={(e) => setReceivedUsdStr(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Cash Received (KHR ៛)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-foreground/40">៛</span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={receivedKhrStr}
                      onChange={(e) => setReceivedKhrStr(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Change Display */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Change Due</div>
                  <div className="text-xl font-black text-emerald-600">${changeUsd.toFixed(2)} USD</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-emerald-600/70">In Riel</div>
                  <div className="text-base font-extrabold text-emerald-600">{changeKhr.toLocaleString()} ៛</div>
                </div>
              </div>
            </div>
          )}

          {/* --- BANK / KHQR / QR TRANSFER METHOD --- */}
          {!isCash && activeCode !== 'DEBT' && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/30 border border-border/40 rounded-2xl text-center space-y-3">
                {currentMethod?.qrCodeUrl ? (
                  <div className="inline-block p-2.5 bg-white rounded-2xl shadow-md border border-slate-200">
                    <img
                      src={currentMethod.qrCodeUrl}
                      alt={currentMethod.name}
                      className="w-40 h-40 object-contain rounded-xl mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-black text-foreground">{currentMethod?.name || activeCode}</h3>
                  {currentMethod?.accountName && (
                    <div className="text-xs font-bold text-foreground/80 mt-0.5">
                      Account: <span className="font-black text-primary">{currentMethod.accountName}</span>
                    </div>
                  )}
                  {currentMethod?.accountNumber && (
                    <div className="text-xs font-mono font-bold text-foreground/60">
                      No: {currentMethod.accountNumber}
                    </div>
                  )}
                </div>

                <p className="text-xs font-extrabold text-primary">
                  Pay: ${totalAmount.toFixed(2)} USD ({totalKhr.toLocaleString()} ៛)
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                  Transaction Reference Number / ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. 984712 (Bank Approval / Ref Code)"
                  className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* --- DEBT / CUSTOMER CREDIT METHOD --- */}
          {activeCode === 'DEBT' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                  Customer Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={debtCustomerId}
                  onChange={(e) => setDebtCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                >
                  <option value="walk-in">-- Select Customer for Debt --</option>
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.fullName} ({c.phone || 'No Phone'}) - Debt: ${Number(c.totalDebt || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
                {debtCustomerId === 'walk-in' && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">
                    ⚠️ Customer account is required for Debt / Credit sales.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Initial Deposit / Paid ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalAmount}
                    value={initialDepositStr}
                    onChange={(e) => setInitialDepositStr(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDateStr}
                    onChange={(e) => setDueDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-amber-600">
                <span className="text-xs font-bold">Remaining Balance Due:</span>
                <span className="text-base font-black">${debtBalance.toFixed(2)} USD</span>
              </div>
            </div>
          )}

          {/* Cashier Notes */}
          <div>
            <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
              Cashier Memo / Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by cashier"
              className="w-full px-3 py-1.5 bg-secondary/30 border border-border/60 rounded-xl text-xs font-extrabold focus:outline-none focus:border-primary"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border/60 hover:bg-secondary text-foreground/70 font-extrabold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || (activeCode === 'DEBT' && debtCustomerId === 'walk-in')}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'Processing...' : 'Confirm & Print Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
