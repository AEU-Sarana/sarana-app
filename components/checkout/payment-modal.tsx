'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from './customer-selector';
import { useLanguage } from '../../contexts/language-context';

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
  const [activeMethod, setActiveMethod] = useState<'CASH' | 'KHQR' | 'CARD' | 'DEBT'>('CASH');

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

  // Sync selected customer when modal opens
  useEffect(() => {
    setDebtCustomerId(selectedCustomerId);
  }, [selectedCustomerId, isOpen]);

  // Set default received amount to exact total when opening Cash modal
  useEffect(() => {
    if (isOpen && activeMethod === 'CASH' && !receivedUsdStr && !receivedKhrStr) {
      setReceivedUsdStr(totalAmount.toString());
    }
  }, [isOpen, activeMethod, totalAmount]);

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
    let finalMethod = 'CASH';
    let customer_id: number | undefined = undefined;

    if (debtCustomerId !== 'walk-in') {
      const parsedId = parseInt(debtCustomerId, 10);
      if (!isNaN(parsedId)) customer_id = parsedId;
    }

    if (activeMethod === 'CASH') {
      finalMethod = 'CASH';
      initial_paid = totalAmount;
      finalReceived = Math.max(totalAmount, totalReceivedInUsd);
    } else if (activeMethod === 'KHQR') {
      finalMethod = 'BANK_TRANSFER';
      initial_paid = totalAmount;
      finalReceived = totalAmount;
    } else if (activeMethod === 'CARD') {
      finalMethod = 'CARD';
      initial_paid = totalAmount;
      finalReceived = totalAmount;
    } else if (activeMethod === 'DEBT') {
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
      payment_due_date: activeMethod === 'DEBT' ? dueDateStr : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-border/40 bg-secondary/30 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">
              {t('pos.complete_payment', 'Complete Payment')}
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">
              Select payment method & record transaction reference details
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground text-sm font-bold transition-all"
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

        {/* Payment Method Selector Tabs (Text Only) */}
        <div className="p-3 bg-secondary/20 border-b border-border/30 grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMethod('CASH')}
            className={`py-3 px-2 rounded-xl text-xs font-black transition-all text-center ${
              activeMethod === 'CASH'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card hover:bg-secondary text-foreground/70'
            }`}
          >
            Cash
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('KHQR')}
            className={`py-3 px-2 rounded-xl text-xs font-black transition-all text-center ${
              activeMethod === 'KHQR'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card hover:bg-secondary text-foreground/70'
            }`}
          >
            ABA / QR
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('CARD')}
            className={`py-3 px-2 rounded-xl text-xs font-black transition-all text-center ${
              activeMethod === 'CARD'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card hover:bg-secondary text-foreground/70'
            }`}
          >
            Card
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('DEBT')}
            className={`py-3 px-2 rounded-xl text-xs font-black transition-all text-center ${
              activeMethod === 'DEBT'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card hover:bg-secondary text-foreground/70'
            }`}
          >
            Debt
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* --- CASH METHOD --- */}
          {activeMethod === 'CASH' && (
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
                      className="px-3.5 py-1.5 bg-secondary/60 hover:bg-secondary border border-border/40 hover:border-primary/40 text-foreground text-xs font-black rounded-xl transition-all"
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
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 text-xs font-black rounded-xl transition-all"
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

          {/* --- ABA / KHQR TRANSFER METHOD --- */}
          {activeMethod === 'KHQR' && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/30 border border-border/40 rounded-2xl text-center space-y-2">
                <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-32 h-32 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-mono">
                    [ STORE KHQR ]
                  </div>
                </div>
                <p className="text-xs font-extrabold text-foreground/80">Scan KHQR code to pay ${totalAmount.toFixed(2)} USD</p>
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
                  placeholder="e.g. 984712 (ABA Approval / Ref Code)"
                  className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* --- CARD METHOD --- */}
          {activeMethod === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                  Card Approval Code / Reference #
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TXN-998822 (POS Terminal Approval)"
                  className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-sm font-black focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* --- DEBT / CUSTOMER CREDIT METHOD --- */}
          {activeMethod === 'DEBT' && (
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
              className="px-4 py-2.5 rounded-xl border border-border/60 hover:bg-secondary text-foreground/70 font-extrabold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || (activeMethod === 'DEBT' && debtCustomerId === 'walk-in')}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Confirm & Print Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
