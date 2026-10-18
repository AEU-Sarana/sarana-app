'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../contexts/language-context';
import { tokenStorage } from '@/services/tokenStorage';
import { BASE_URL } from '@/services/apiClient';
import SearchableSelect from '../../../components/ui/searchable-select';

export default function AdminPurchasingDashboardPage() {
  const { t } = useLanguage();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);

      const res = await fetch(`${BASE_URL}/purchasing/orders?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPos(data.data || []);
      }
    } catch (err) {
      console.error('Fetch POs failed:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-secondary text-muted-foreground border-border/40';
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'PARTIAL_RECEIVED':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'RECEIVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  const metrics = {
    total: pos.length,
    drafts: pos.filter((p) => p.status === 'DRAFT').length,
    pending: pos.filter((p) => ['APPROVED', 'PARTIAL_RECEIVED'].includes(p.status)).length,
    received: pos.filter((p) => p.status === 'RECEIVED').length,
  };

  const safeFormatCurrency = (val: any) => {
    const num = Number(val ?? 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t('purchasing.title', 'Purchase Orders')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('purchasing.subtitle', 'Build, approve, print, and receive stock from supplier purchase orders.')}
          </p>
        </div>
        <Link
          href="/admin/purchasing/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all shadow-md shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('purchasing.create_btn', 'Create Purchase Order')}
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.total}</div>
            <div className="text-xs text-muted-foreground font-medium">Total PO Requests</div>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.pending}</div>
            <div className="text-xs text-muted-foreground font-medium">Pending Deliveries</div>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.received}</div>
            <div className="text-xs text-muted-foreground font-medium">Completed / Stocked In</div>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.drafts}</div>
            <div className="text-xs text-muted-foreground font-medium">Draft Orders</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-2xl border border-border/40 shadow-sm">
        <div className="relative flex-1 w-full">
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO # or Supplier company..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-56 shrink-0">
          <SearchableSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            placeholder="All Statuses"
            searchPlaceholder="Search PO status..."
            allowClear
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft', badge: 'Draft' },
              { value: 'APPROVED', label: 'Approved', badge: 'Active' },
              { value: 'PARTIAL_RECEIVED', label: 'Partial Received', badge: 'Partial' },
              { value: 'RECEIVED', label: 'Fully Received', badge: 'Complete' },
              { value: 'CANCELLED', label: 'Cancelled', badge: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="block md:hidden divide-y divide-border/20 bg-card border border-border/40 rounded-2xl p-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs font-semibold text-muted-foreground">
            Loading purchase orders...
          </div>
        ) : pos.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-muted-foreground">
            No purchase orders found. Create a new purchase order to start processing stock.
          </div>
        ) : (
          pos.map((po) => (
            <div key={po.poId || po.po_id} className="pt-4 first:pt-0 space-y-3 select-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/purchasing/${po.poId || po.po_id}`} className="text-sm font-bold text-primary hover:underline">
                    {po.poNumber || po.po_number}
                  </Link>
                  <h4 className="text-xs font-semibold text-foreground mt-0.5">{po.supplier?.companyName || po.suppliers?.company_name || '—'}</h4>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Order Date: {new Date(po.orderDate || po.order_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-foreground block font-mono">
                    ${safeFormatCurrency(po.totalAmount ?? po.total_amount)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${getStatusBadge(po.status)}`}>
                    {po.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-border/10">
                <Link
                  href={`/admin/purchasing/${po.poId || po.po_id}`}
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-semibold transition-colors border border-border/40 inline-block"
                >
                  View & Print
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4 text-right">Total ($)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No purchase orders found. Create a new purchase order to start processing stock.
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.poId || po.po_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-foreground">
                      <Link href={`/admin/purchasing/${po.poId || po.po_id}`} className="hover:underline text-primary">
                        {po.poNumber || po.po_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {po.supplier?.companyName || po.suppliers?.company_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(po.orderDate || po.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      ${safeFormatCurrency(po.totalAmount ?? po.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                          po.status
                        )}`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/admin/purchasing/${po.poId || po.po_id}`}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-xs font-medium transition-colors border border-border/40 inline-block"
                      >
                        View & Print
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
