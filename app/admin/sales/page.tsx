'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { saleService } from '../../../services/saleService';
import { userService } from '../../../services/userService';
import { Order } from '../../../features/sale/types';
import { User } from '../../../features/user/types';
import { SalesListTable } from '../../../components/sales/sales-list-table';
import OrderDetailModal from '../../../components/sales/order-detail-modal';

const PAGE_LIMIT = 10;

export default function AdminSalesPage() {
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === 'ADMIN';

  // Sales and pagination state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters State
  const [receiptSearch, setReceiptSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');

  // Dropdown list of sellers/users (only for Admin)
  const [sellersList, setSellersList] = useState<User[]>([]);

  // Detailed Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch users/sellers if Admin
  useEffect(() => {
    if (isAdmin) {
      userService.listUsers({ limit: 100 })
        .then((res) => {
          setSellersList(res.users);
        })
        .catch((err) => {
          console.error('Failed to load sellers list:', err);
        });
    }
  }, [isAdmin]);

  // Fetch sales records
  const fetchSalesList = useCallback(async (opts: {
    page?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    sellerId?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: opts.page ?? 1,
        limit: PAGE_LIMIT,
      };

      // Add filter queries if present
      if (opts.search) params.search = opts.search;
      if (opts.startDate) params.start_date = new Date(opts.startDate).toISOString();
      if (opts.endDate) {
        // Set to end of day to make filter inclusive
        const endOfDay = new Date(opts.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        params.end_date = endOfDay.toISOString();
      }
      if (opts.sellerId) params.seller_id = parseInt(opts.sellerId, 10);

      const res = await saleService.listOrders(params);
      setOrders(res.orders);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve sales records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount or when pagination/filters change
  useEffect(() => {
    fetchSalesList({ 
      page, 
      search: receiptSearch, 
      startDate, 
      endDate, 
      sellerId: selectedSeller 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate, selectedSeller]);

  // Search handler (debounced)
  const handleSearchChange = (v: string) => {
    setReceiptSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchSalesList({ 
        page: 1, 
        search: v, 
        startDate, 
        endDate, 
        sellerId: selectedSeller 
      });
    }, 400);
  };

  const handleResetFilters = () => {
    setReceiptSearch('');
    setStartDate('');
    setEndDate('');
    setSelectedSeller('');
    setPage(1);
    fetchSalesList({ page: 1, search: '', startDate: '', endDate: '', sellerId: '' });
  };

  const handleRefresh = () => {
    fetchSalesList({ 
      page, 
      search: receiptSearch, 
      startDate, 
      endDate, 
      sellerId: selectedSeller 
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrderId(order.order_id);
    setIsDetailModalOpen(true);
  };

  const hasActiveFilters = receiptSearch !== '' || startDate !== '' || endDate !== '' || selectedSeller !== '';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Sales History</h1>
          <p className="text-xs text-foreground/50 mt-1">
            Browse, search, and audit POS transaction invoices and payment records.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto select-none">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh Transactions"
            className="group flex-1 sm:flex-initial px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary dark:bg-secondary/20 dark:hover:bg-secondary/35 border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${
                isLoading ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-3.5 select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              placeholder="Search receipt number (e.g. RCP-)..."
              value={receiptSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
            />
            <svg className="absolute left-4 top-4.5 w-5 h-5 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Start Date */}
          <div className="lg:col-span-2.5 flex flex-col">
            <input
              type="date"
              title="Start Date"
              value={startDate}
              onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-xs font-bold text-foreground focus:border-primary outline-none cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-2.5 flex flex-col">
            <input
              type="date"
              title="End Date"
              value={endDate}
              onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-xs font-bold text-foreground focus:border-primary outline-none cursor-pointer"
            />
          </div>

          {/* Seller / Cashier Filter (Admin only) */}
          <div className="lg:col-span-3">
            {isAdmin ? (
              <select
                value={selectedSeller}
                onChange={(e) => { setPage(1); setSelectedSeller(e.target.value); }}
                className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-xs font-bold text-foreground focus:border-primary outline-none cursor-pointer"
              >
                <option value="">All Cashiers & Admins</option>
                {sellersList.map((seller) => (
                  <option key={seller.userId} value={seller.userId}>
                    {seller.fullName} (@{seller.username})
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 rounded-xl border border-border/20 bg-secondary/10 text-xs font-semibold text-foreground/45 select-none">
                Viewing: Your sales records only
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-1 animate-fade-in">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer border border-primary/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear active filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table view */}
      <SalesListTable
        orders={orders}
        isLoading={isLoading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onViewDetails={handleViewDetails}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailModalOpen}
        orderId={selectedOrderId}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
