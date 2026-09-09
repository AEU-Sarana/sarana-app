'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../contexts/language-context';
import { useAuth } from '../../../hooks/useAuth';
import { customerService, CustomerWithPurchases } from '../../../services/customerService';
import CustomerListTable from '../../../components/customers/customer-list-table';
import CustomerModal from '../../../components/customers/customer-modal';
import CustomerDetailModal from '../../../components/customers/customer-detail-modal';

export default function AdminCustomersPage() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const canCreateCustomer = can('customers.manage', 'create');

  const [customers, setCustomers] = useState<CustomerWithPurchases[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithPurchases | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerWithPurchases | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await customerService.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery.trim() || undefined,
      });

      setCustomers(res.customers || []);
      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        }));
      }
    } catch (err: any) {
      console.error('Failed to retrieve customers', err);
      setErrorMessage(err.message || 'Failed to retrieve customers directory from server.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: CustomerWithPurchases) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  // Metrics computation for summary cards
  const totalDebtSum = customers.reduce((sum, c) => sum + Number(c.totalDebt || 0), 0);
  const activeDebtorsCount = customers.filter((c) => Number(c.totalDebt || 0) > 0).length;
  const totalRevenueSum = customers.reduce((sum, c) => sum + Number(c.totalPaid || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {t('customers.title', 'Customer Directory')}
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            {t('customers.subtitle', 'Manage pharmacy customer records, track purchases, register contact info, and monitor credit balances.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/admin/customers/debt"
            className="flex-1 sm:flex-initial px-4.5 py-3 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/75 hover:text-foreground font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{t('customers.customer_debt_ledger', 'Customer Debt (AR)')}</span>
          </Link>

          <button
            onClick={() => fetchCustomers()}
            disabled={isLoading}
            title="Refresh Directory Data"
            className="px-3.5 py-3 bg-secondary/50 hover:bg-secondary border border-border/40 rounded-xl text-foreground/60 hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {canCreateCustomer && (
            <button
              onClick={handleAddCustomer}
              className="flex-1 sm:flex-initial px-5 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              {t('customers.add_customer', 'Add Customer')}
            </button>
          )}
        </div>
      </div>

      {/* 2. Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Total Customers */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="w-13 h-13 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold shrink-0 border border-primary/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('customers.total_customers', 'Total Customers')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">{pagination.total}</span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">Registered profiles</span>
          </div>
        </div>

        {/* Total Lifetime Revenue */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="w-13 h-13 rounded-2xl bg-success/10 text-success flex items-center justify-center font-extrabold shrink-0 border border-success/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m-9 1h18s-2-2-2-4V9a7 7 0 00-14 0v6c0 2-2 4-2 4z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('customers.page_sales', 'Total Customer Spend')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">${totalRevenueSum.toFixed(2)}</span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">Completed orders total</span>
          </div>
        </div>

        {/* Active Debtors */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="w-13 h-13 rounded-2xl bg-warning/10 text-warning flex items-center justify-center font-extrabold shrink-0 border border-warning/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('customers.active_debtors', 'Active Debtors')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">{activeDebtorsCount}</span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">Customers with open balance</span>
          </div>
        </div>

        {/* Outstanding Debt Sum */}
        <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="w-13 h-13 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center font-extrabold shrink-0 border border-destructive/5">
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{t('customers.total_debt_page', 'Outstanding Credit')}</span>
            <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">${totalDebtSum.toFixed(2)}</span>
            <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">Uncollected credit total</span>
          </div>
        </div>

      </div>

      {/* 3. Search Bar */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder={t('customers.search_placeholder', 'Search customer by full name, phone number, or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 text-sm font-semibold focus:border-primary/80 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
          />
          <svg className="absolute left-4 top-4 w-5 h-5 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
        <CustomerListTable
          customers={customers}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onEdit={handleEditCustomer}
          onViewDetail={setViewingCustomer}
          onRetry={fetchCustomers}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalEntries={pagination.total}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchCustomers();
        }}
        customer={editingCustomer}
      />

      <CustomerDetailModal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        customer={viewingCustomer}
      />
    </div>
  );
}
