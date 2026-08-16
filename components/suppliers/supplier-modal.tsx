'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/language-context';
import { tokenStorage } from '@/services/tokenStorage';

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
        ? `http://localhost:8088/api/v1/suppliers/${supplier.supplierId || supplier.supplier_id}`
        : 'http://localhost:8088/api/v1/suppliers';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-foreground animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center bg-card">
          <h3 className="text-lg font-bold text-foreground">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Mr. Sok"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
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
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@supplier.com"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
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
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Payment Terms
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary text-sm"
            >
              <option value="COD">COD (Cash on Delivery)</option>
              <option value="NET_7">NET 7 Days</option>
              <option value="NET_15">NET 15 Days</option>
              <option value="NET_30">NET 30 Days</option>
              <option value="NET_60">NET 60 Days</option>
            </select>
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
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border/40 bg-secondary hover:bg-secondary/80 text-foreground transition-colors text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
