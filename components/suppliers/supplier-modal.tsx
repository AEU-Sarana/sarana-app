'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/language-context';
import { tokenStorage } from '@/services/tokenStorage';
import { BASE_URL } from '@/services/apiClient';
import SearchableSelect from '../ui/searchable-select';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: any;
}

export default function SupplierModal({ isOpen, onClose, onSuccess, supplier }: SupplierModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET_30');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setCompanyName(supplier.companyName || supplier.company_name || '');
      setContactPerson(supplier.contactPerson || supplier.contact_person || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setTaxId(supplier.taxId || supplier.tax_id || '');
      setPaymentTerms(supplier.paymentTerms || supplier.payment_terms || 'NET_30');
    } else {
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxId('');
      setPaymentTerms('NET_30');
    }
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    try {
      const url = supplier
        ? `${BASE_URL}/suppliers/${supplier.supplierId || supplier.supplier_id}`
        : `${BASE_URL}/suppliers`;

      const method = supplier ? 'PUT' : 'POST';

      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName,
          contactPerson,
          phone,
          email,
          address,
          taxId,
          paymentTerms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Error saving supplier');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-foreground animate-in fade-in zoom-in duration-200 my-auto max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border/40 flex justify-between items-center bg-card shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Company / Vendor Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Angkor Beverages Co., Ltd"
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Mr. Sok"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +855 12 345 678"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@supplier.com"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Tax ID / VAT #
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="K001-9021-X"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Payment Terms
            </label>
            <SearchableSelect
              value={paymentTerms}
              onChange={(val) => setPaymentTerms(String(val))}
              placeholder="Select or enter payment terms..."
              searchPlaceholder="Search or type custom terms (e.g. NET_45)..."
              allowCustomValue
              options={[
                { value: 'COD', label: 'COD (Cash on Delivery)', sublabel: 'Immediate settlement upon receipt' },
                { value: 'NET_7', label: 'NET 7 Days', sublabel: 'Payment due within 7 calendar days' },
                { value: 'NET_15', label: 'NET 15 Days', sublabel: 'Payment due within 15 calendar days' },
                { value: 'NET_30', label: 'NET 30 Days', sublabel: 'Payment due within 30 calendar days (Standard)' },
                { value: 'NET_60', label: 'NET 60 Days', sublabel: 'Extended payment terms 60 days' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, Khan, City..."
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border/40 bg-secondary hover:bg-secondary/80 text-foreground transition-colors text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
