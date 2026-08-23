'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SupplierModal from '@/components/suppliers/supplier-modal';
import { useLanguage } from '../../../contexts/language-context';
import { tokenStorage } from '@/services/tokenStorage';

export default function AdminSuppliersPage() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`http://localhost:8088/api/v1/suppliers${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (err) {
      console.error('Fetch suppliers failed:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sup: any) => {
    setSelectedSupplier(sup);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t('suppliers.title', 'Suppliers & Vendors')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('suppliers.subtitle', 'Manage supplier contact details, payment terms, and vendor profiles.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/purchasing"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-all border border-border/50 shadow-sm cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Purchase Orders
          </Link>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('suppliers.add_btn', 'Add Supplier')}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border/40 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('suppliers.search_placeholder', 'Search suppliers by name, contact, phone, email...')}
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Phone / Email</th>
                <th className="px-6 py-4">Terms</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No suppliers found. Click "Add Supplier" to create your first vendor profile.
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => (
                  <tr key={sup.supplierId || sup.supplier_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {sup.companyName || sup.company_name}
                      {sup.taxId || sup.tax_id ? (
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">Tax #: {sup.taxId || sup.tax_id}</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {sup.contactPerson || sup.contact_person || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{sup.phone || '—'}</div>
                      <div className="text-xs text-muted-foreground">{sup.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border/40">
                        {sup.paymentTerms || sup.payment_terms || 'NET_30'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          sup.isActive || sup.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {sup.isActive || sup.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(sup)}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium transition-colors border border-border/40 cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />
    </div>
  );
}
