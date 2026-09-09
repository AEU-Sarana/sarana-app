'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/language-context';
import { customerService, CustomerWithPurchases } from '../../services/customerService';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customer?: CustomerWithPurchases | null;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSave,
  customer,
}: CustomerModalProps) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
    }
    setErrorMsg(null);
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(t('customers.name_required', 'Full Name is required.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (customer) {
        await customerService.updateCustomer(customer.customerId, {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        });
      } else {
        await customerService.createCustomer({
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        });
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save customer details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-border/40 rounded-3xl shadow-xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/30 flex justify-between items-center bg-secondary/15 select-none">
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">
              {customer ? t('customers.edit_customer', 'Edit Customer Profile') : t('customers.add_customer', 'Register New Customer')}
            </h3>
            <p className="text-xs text-foreground/50 mt-0.5">
              {customer
                ? t('customers.edit_subtitle', 'Update customer contact information and profile details.')
                : t('customers.add_subtitle', 'Fill in customer information for order tracking & credit profile.')}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5">
              {t('customers.full_name', 'Full Name')} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sok Chan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5">
              {t('customers.phone', 'Phone Number')}
            </label>
            <input
              type="text"
              placeholder="e.g. 012 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-foreground/75 mb-1.5">
              {t('customers.email', 'Email Address')}
            </label>
            <input
              type="email"
              placeholder="e.g. customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border/20 flex items-center justify-end gap-3 select-none">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary text-foreground/75 hover:text-foreground text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-sm shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{customer ? t('common.save_changes', 'Save Changes') : t('customers.create_button', 'Create Customer')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
