'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { dashboardService } from '../../../services/dashboardService';
import { DashboardOverviewResponse } from '../../../features/dashboard/types';
import { stockService } from '../../../services/stockService';
import { customerService } from '../../../services/customerService';
import DashboardCard from '../../../components/dashboard/dashboard-card';
import SplineChart from '../../../components/dashboard/spline-chart';
import ProductHealthDonut from '../../../components/dashboard/product-health-donut';
import { getInitials } from '../../../libs/utils';

export interface CustomerPurchase {
  productId: number;
  productName: string;
  quantity: number;
  totalSpent: number;
}

export interface CustomerWithPurchases {
  customerId: number;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  telegramLinked: boolean;
  createdAt: string;
  lastBuyAt: string | null;
  purchases: CustomerPurchase[];
  totalPaid: number;
}

const mockCustomers: CustomerWithPurchases[] = [
  {
    customerId: 1,
    fullName: 'Sok Chan',
    phone: '012345678',
    email: 'sok.chan@gmail.com',
    telegramLinked: true,
    createdAt: '2026-05-15T08:30:00Z',
    lastBuyAt: '2026-05-28T09:30:00Z',
    purchases: [
      { productId: 1, productName: 'Amoxicillin 500mg', quantity: 3, totalSpent: 15.00 },
      { productId: 2, productName: 'Paracetamol 500mg', quantity: 5, totalSpent: 2.50 }
    ],
    totalPaid: 20.00
  },
  {
    customerId: 2,
    fullName: 'Dara Sok',
    phone: '098765432',
    email: 'dara.sok@yahoo.com',
    telegramLinked: true,
    createdAt: '2026-05-20T10:15:00Z',
    lastBuyAt: '2026-05-29T14:15:00Z',
    purchases: [
      { productId: 3, productName: 'Ibuprofen 400mg', quantity: 2, totalSpent: 8.00 }
    ],
    totalPaid: 10.00
  },
  {
    customerId: 3,
    fullName: 'Sreyneang Kong',
    phone: '015999888',
    email: 'sreyneang.k@outlook.com',
    telegramLinked: false,
    createdAt: '2026-05-22T14:45:00Z',
    lastBuyAt: null,
    purchases: [],
    totalPaid: 0.00
  },
  {
    customerId: 4,
    fullName: 'Sopheap Heng',
    phone: '081223344',
    email: 'sopheap.heng@example.com',
    telegramLinked: true,
    createdAt: '2026-05-25T09:00:00Z',
    lastBuyAt: '2026-06-02T11:20:00Z',
    purchases: [
      { productId: 4, productName: 'Vitamin C 1000mg', quantity: 4, totalSpent: 20.00 },
      { productId: 1, productName: 'Amoxicillin 500mg', quantity: 1, totalSpent: 5.00 },
      { productId: 5, productName: 'Decolgen Forte', quantity: 10, totalSpent: 6.00 }
    ],
    totalPaid: 31.00
  },
  {
    customerId: 5,
    fullName: 'Ratha Soth',
    phone: '077556677',
    email: 'ratha.soth@gmail.com',
    telegramLinked: false,
    createdAt: '2026-05-28T16:20:00Z',
    lastBuyAt: null,
    purchases: [],
    totalPaid: 0.00
  },
  {
    customerId: 6,
    fullName: 'Sokha Chan',
    phone: '010555666',
    email: 'sokha.chan@gmail.com',
    telegramLinked: true,
    createdAt: '2026-05-29T11:40:00Z',
    lastBuyAt: '2026-06-01T15:45:00Z',
    purchases: [
      { productId: 2, productName: 'Paracetamol 500mg', quantity: 10, totalSpent: 5.00 },
      { productId: 1, productName: 'Amoxicillin 500mg', quantity: 2, totalSpent: 10.00 }
    ],
    totalPaid: 15.00
  },
  {
    customerId: 7,
    fullName: 'Sokheng Sok',
    phone: '093888777',
    email: 'sokheng.sok@yahoo.com',
    telegramLinked: true,
    createdAt: '2026-05-30T15:10:00Z',
    lastBuyAt: '2026-05-31T10:00:00Z',
    purchases: [
      { productId: 3, productName: 'Ibuprofen 400mg', quantity: 4, totalSpent: 16.00 }
    ],
    totalPaid: 20.00
  },
  {
    customerId: 8,
    fullName: 'Sokhom Dara',
    phone: '070222111',
    email: 'sokhom.dara@gmail.com',
    telegramLinked: false,
    createdAt: '2026-06-01T09:15:00Z',
    lastBuyAt: null,
    purchases: [],
    totalPaid: 0.00
  }
];

function RevenueGrowthChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const values = [1200, 1800, 2300, 1950, 2100, 1700, 1500, 1900, 2400, 2800, 2200, 3000];
  const maxValue = 3500;

  const yTicks = [
    { label: '$0',  value: 0 },
    { label: '$1K', value: 1000 },
    { label: '$2K', value: 2000 },
    { label: '$3K', value: 3000 },
  ];

  const fmt = (v: number) => `$${(v / 1000).toFixed(1)}K`;

  return (
    <SplineChart
      title="Revenue Growth"
      subtitle="Monthly analytics overview"
      badgeText="Real-time"
      badgeAccentColor="emerald"
      labels={months}
      values={values}
      maxValue={maxValue}
      yTicks={yTicks}
      peakLabelFormatter={fmt}
      lineColor="#059669"
      areaGradientId="area-gradient"
      areaGradientColor="#10b981"
      valueFormatter={fmt}
      displayValueThreshold={2000}
      fillClassName="fill-emerald-500 dark:fill-emerald-400"
    />
  );
}

// ─── Customer UI Helper Functions ───────────────────────────────────────────


function getAvatarColor(name: string | null): string {
  return 'from-indigo-500 to-indigo-600 text-white';
}

function formatBuyAt(dateStr: string | null): React.ReactNode {
  if (!dateStr) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-secondary/35 text-foreground/30 border border-border/10 uppercase tracking-wider select-none">
        Never
      </span>
    );
  }

  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let relativeStr = '';
  if (diffDays === 0) relativeStr = 'Today';
  else if (diffDays === 1) relativeStr = 'Yesterday';
  else if (diffDays <= 7) relativeStr = `${diffDays} days ago`;
  else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    relativeStr = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    relativeStr = `${months} month${months > 1 ? 's' : ''} ago`;
  }

  return (
    <div className="flex flex-col gap-0.5 select-none">
      <span className="text-xs font-black text-foreground/80">
        {date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </span>
      <span className="text-[10px] font-bold text-indigo-500/80">
        {relativeStr}
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [customers, setCustomers] = useState<CustomerWithPurchases[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [telegramFilter, setTelegramFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, stockRes, customersRes] = await Promise.all([
        dashboardService.getOverview(),
        stockService.getStockList({ limit: 1 }),
        customerService.getCustomers({ limit: 100 }),
      ]);
      setData(overviewRes);
      setOutOfStockCount(stockRes.summary.out_of_stock_count || 0);
      setLowStockCount(stockRes.summary.low_stock_count || 0);
      setTotalProducts(stockRes.summary.total_products || 0);
      if (customersRes && customersRes.customers) {
        setCustomers(customersRes.customers);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatUSD = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatKHR = (n: number, rate: number = 4000) => {
    const khr = Math.round(n * rate);
    return `${khr.toLocaleString()} KHR`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {getGreeting()}, {currentUser?.fullName || 'User'}!
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Here's an overview of today's operational stats and stock health.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${
              isLoading ? 'animate-spin' : ''
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

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl select-none">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Cards Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse select-none">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-6 bg-card border border-border/20 rounded-3xl h-36 flex items-center gap-5">
              <div className="w-11 h-11 bg-secondary/30 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary/30 rounded-md w-1/2" />
                <div className="h-6 bg-secondary/40 rounded-md w-2/3" />
                <div className="h-2.5 bg-secondary/20 rounded-md w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        (() => {
          const salesAmount = data?.today_summary?.total_sales_amount || 0;
          const salesCount = data?.today_summary?.total_sales_count || 0;

          // Client-side search and filtering for customers
          const filteredCustomers = customers.filter(customer => {
            const matchesSearch = 
              (customer.fullName && customer.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (customer.phone && customer.phone.includes(searchQuery)) ||
              (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
              
            if (telegramFilter === 'linked') return matchesSearch && customer.telegramLinked;
            if (telegramFilter === 'unlinked') return matchesSearch && !customer.telegramLinked;
            return matchesSearch;
          });

          const totalCustomers = filteredCustomers.length;
          const totalPages = Math.ceil(totalCustomers / pageSize);
          const paginatedCustomers = filteredCustomers.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
          );

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Sales Amount */}
              <DashboardCard
                label="Today's Sales"
                value={formatUSD(salesAmount)}
                subtext="Accumulated today"
                trend="+14.2%"
                trendType="up"
                accentColor="emerald"
                href="/admin/sales"
                icon={
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              {/* Today's Sales Count */}
              <DashboardCard
                label="Today's Orders"
                value={`${salesCount} Receipts`}
                subtext="POS transactions synced"
                trend="+8.6%"
                trendType="up"
                accentColor="indigo"
                href="/admin/sales"
                icon={
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                }
              />

              {/* Total Customers count */}
              <DashboardCard
                label="Total Customers"
                value={`${customers.length} Customers`}
                subtext="Registered in directory"
                trend="Directory"
                trendType="up"
                accentColor="sky"
                icon={
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />

              {/* Expected Drawer Cash (Cashier) or Low Stock Warnings (Admin) */}
              {isAdmin ? (
                <DashboardCard
                  label="Low Stock Alert"
                  value={`${data?.low_stock_warnings?.length || 0} Alert Items`}
                  subtext=" replenishment needed"
                  trend="-2 items"
                  trendType="up"
                  accentColor="amber"
                  href="/admin/stock?status=low_stock"
                  icon={
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                />
              ) : (
                <DashboardCard
                  label="Expected Cash Drawer"
                  value={formatUSD(data?.today_summary?.expected_cash || 0)}
                  subtext="Total cash in drawer"
                  trend="Balanced"
                  trendType="neutral"
                  accentColor="amber"
                  icon={
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              )}
              </div>

              {/* Revenue Growth spline area chart + side cards area */}
              <div className="flex gap-6 items-stretch">
                <div className="w-[60%] shrink-0">
                  <RevenueGrowthChart />
                </div>
                {/* Side panel — Product Health Donut */}
                <div className="w-[40%] flex flex-col gap-4">
                  <ProductHealthDonut
                    total={totalProducts}
                    lowStock={lowStockCount}
                    outOfStock={outOfStockCount}
                    expired={0}  // TODO: wire to backend when expired_count is added to StockSummary
                  />
                </div>
              </div>

              {/* Customer Purchases Section */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
                  <div>
                    <h2 className="text-base font-black text-foreground tracking-tight">Customer Directory & Purchases</h2>
                    <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">Overview of customer contact info and pharmacy purchases</p>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-foreground/30">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Search name, phone, email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9 pr-4 py-2 bg-secondary/40 border border-border/40 hover:border-border/80 focus:border-indigo-500/50 rounded-xl text-xs font-bold text-foreground placeholder:text-foreground/30 focus:outline-none w-56 transition-all duration-200"
                      />
                    </div>
                    
                    <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl">
                      {(['all', 'linked', 'unlinked'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setTelegramFilter(filter);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            telegramFilter === filter
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-foreground/50 hover:text-foreground'
                          }`}
                        >
                          {filter === 'all' ? 'All' : filter === 'linked' ? 'Linked' : 'Not Linked'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full rounded-2xl border border-border/30 bg-secondary/5">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-secondary/35 border-b border-border/30">
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Customer ID</th>
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Name</th>
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Contact Info</th>
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Purchased Price</th>
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Customer Paid</th>
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Telegram Status</th>
                        <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Buy At</th>
                        <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-foreground/45">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {paginatedCustomers.length > 0 ? (
                        paginatedCustomers.map((customer) => (
                          <tr key={customer.customerId} className="hover:bg-secondary/15 transition-colors duration-150">
                            <td className="px-5 py-4 font-mono text-xs text-foreground/40 font-bold">
                              #{String(customer.customerId).padStart(3, '0')}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(customer.fullName)} flex items-center justify-center text-xs font-black tracking-wider shadow-sm border border-white/5`}>
                                  {getInitials(customer.fullName)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-foreground">{customer.fullName || 'Unnamed Customer'}</span>
                                  <span className="text-[9px] font-bold text-foreground/35 uppercase tracking-wider mt-0.5">ID: #{String(customer.customerId).padStart(3, '0')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 space-y-1">
                              <div className="text-xs font-bold text-foreground/75 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-foreground/35" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.122-4.1-6.924-6.924l1.293-.97a1.242 1.242 0 0 0 .417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.11-1.008H4.5a2.25 2.25 0 0 0-2.25 2.25v1.356z" />
                                </svg>
                                {customer.phone || 'N/A'}
                              </div>
                              <div className="text-[11px] font-bold text-foreground/45 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-foreground/35" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                                {customer.email || 'N/A'}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {(() => {
                                const total = customer.purchases.reduce((acc, p) => acc + p.totalSpent, 0);
                                return total > 0 ? (
                                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    ${total.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-foreground/30">$0.00</span>
                                );
                              })()}
                            </td>
                            <td className="px-5 py-4">
                              {customer.totalPaid > 0 ? (
                                <span className="text-sm font-black text-indigo-500">
                                  ${customer.totalPaid.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-foreground/30">$0.00</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {customer.telegramLinked ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  LINKED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-foreground/5 border border-border/30 text-foreground/40 rounded-full text-[10px] font-black tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                  NOT LINKED
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {formatBuyAt(customer.lastBuyAt)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button className="px-3 py-1.5 bg-secondary/40 hover:bg-indigo-600 hover:text-white border border-border/40 hover:border-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95">
                                Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-xs font-bold text-foreground/35 italic">
                            No customers found matching filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/20">
                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                      Page {currentPage} of {totalPages} ({totalCustomers} customers)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-secondary/40 border border-border/40 hover:border-border/80 disabled:opacity-30 rounded-lg text-foreground/60 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:pointer-events-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-secondary/40 text-foreground/60 border border-border/40 hover:border-border/85'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-secondary/40 border border-border/40 hover:border-border/80 disabled:opacity-30 rounded-lg text-foreground/60 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:pointer-events-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
