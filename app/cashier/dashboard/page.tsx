'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../stores';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import Link from 'next/link';
import DashboardCard from '../../../components/dashboard/dashboard-card';
import SplineChart from '../../../components/dashboard/spline-chart';

function HourlyTransactionFlowChart() {
  const hours = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
  const values = [2, 5, 12, 18, 9, 15, 22, 6]; 
  const maxValue = 25; 

  const yTicks = [
    { label: '0',   value: 0 },
    { label: '5 rx',  value: 5 },
    { label: '10 rx', value: 10 },
    { label: '15 rx', value: 15 },
    { label: '20 rx', value: 20 },
    { label: '25 rx', value: 25 },
  ];

  const fmt = (v: number) => `${v} rx`;

  return (
    <SplineChart
      title="Today's Transaction Flow"
      subtitle="Receipts processed hourly"
      badgeText="Shift Active"
      badgeAccentColor="emerald"
      labels={hours}
      values={values}
      maxValue={maxValue}
      yTicks={yTicks}
      peakLabelFormatter={fmt}
      lineColor="#059669"
      areaGradientId="emerald-area-gradient"
      areaGradientColor="#10b981"
      valueFormatter={(v) => `${v}`}
      displayValueThreshold={10}
      fillClassName="fill-emerald-500 dark:fill-emerald-400"
    />
  );
}

interface MockReceipt {
  id: string;
  time: string;
  customerName: string;
  paymentMethod: string;
  total: number;
  status: 'COMPLETED' | 'REFUNDED';
}

const mockReceipts: MockReceipt[] = [
  { id: 'RCP-20260603-028', time: '02:14 PM', customerName: 'Walk-in Customer', paymentMethod: 'ABA Pay', total: 18.50, status: 'COMPLETED' },
  { id: 'RCP-20260603-027', time: '01:45 PM', customerName: 'Sok Chan', paymentMethod: 'Cash', total: 20.00, status: 'COMPLETED' },
  { id: 'RCP-20260603-026', time: '12:30 PM', customerName: 'Dara Sok', paymentMethod: 'ABA Pay', total: 10.00, status: 'COMPLETED' },
  { id: 'RCP-20260603-025', time: '11:15 AM', customerName: 'Walk-in Customer', paymentMethod: 'Cash', total: 5.25, status: 'COMPLETED' },
  { id: 'RCP-20260603-024', time: '10:02 AM', customerName: 'Sopheap Heng', paymentMethod: 'ABA Pay', total: 31.00, status: 'COMPLETED' },
  { id: 'RCP-20260603-023', time: '09:12 AM', customerName: 'Walk-in Customer', paymentMethod: 'Cash', total: 12.45, status: 'COMPLETED' },
  { id: 'RCP-20260603-022', time: '08:45 AM', customerName: 'Sokheng Sok', paymentMethod: 'Wing', total: 20.00, status: 'COMPLETED' },
];

export default function CashierDashboardPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast('Dashboard statistics refreshed');
    }, 600);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-2xl animate-scale-up select-none">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {getGreeting()}, {currentUser?.fullName || 'Cashier'}!
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Welcome back to your counter shift. Here is your checkout performance today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${
                isRefreshing ? 'animate-spin' : ''
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

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales Revenue */}
        <DashboardCard
          label="Today's Sales"
          value="$438.20"
          subtext="Drawer sales tracked today"
          trend="+12.4% vs yesterday"
          trendType="up"
          accentColor="emerald"
          icon={
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Today's Sales Count */}
        <DashboardCard
          label="Receipts Issued"
          value="28 Checkouts"
          subtext="Printed customer receipts"
          trend="+10.2%"
          trendType="up"
          accentColor="indigo"
          icon={
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        {/* Average Ticket Value */}
        <DashboardCard
          label="Average Ticket"
          value="$15.65"
          subtext="Sales amount per transaction"
          trend="Balanced"
          trendType="neutral"
          accentColor="sky"
          icon={
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Counter Status */}
        <DashboardCard
          label="Counter Status"
          value="Online"
          subtext="Counter session open"
          trend="Active"
          trendType="neutral"
          accentColor="amber"
          icon={
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Transaction Spline Chart + Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <HourlyTransactionFlowChart />
        </div>
        
        {/* Quick Operations */}
        <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 select-none h-full">
          <div>
            <h2 className="text-base font-black text-foreground tracking-tight">Quick Operations</h2>
            <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">Counter shortcut controls</p>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4 py-4">
            <Link
              href="/cashier/checkout"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 hover:from-indigo-500/20 hover:to-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black transition-colors duration-300 border border-indigo-500/15">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black text-foreground">Launch Checkout POS</span>
                <span className="text-[10px] font-bold text-foreground/40 mt-0.5">Open register to check out sales</span>
              </div>
            </Link>

            <Link
              href="/cashier/orders"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-sky-500/10 to-sky-600/5 hover:from-sky-500/20 hover:to-sky-600/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:border-sky-500/40 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center font-black transition-colors duration-300 border border-sky-500/15">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black text-foreground">My Orders</span>
                <span className="text-[10px] font-bold text-foreground/40 mt-0.5">View your processed receipts</span>
              </div>
            </Link>

            <Link
              href="/admin/profile"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/20 hover:to-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black transition-colors duration-300 border border-emerald-500/15">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black text-foreground">Account Profile</span>
                <span className="text-[10px] font-bold text-foreground/40 mt-0.5">Update credentials and security</span>
              </div>
            </Link>
          </div>

          <div className="pt-2 text-center">
            <span className="text-[9px] font-extrabold text-foreground/30 uppercase tracking-widest">
              Terminal: POS-KHM-01
            </span>
          </div>
        </div>
      </div>

      {/* Recent Receipts Table */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-black text-foreground tracking-tight">Your Recent Transactions</h2>
          <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">Latest receipts issued by you today</p>
        </div>

        <div className="overflow-x-auto w-full rounded-2xl border border-border/30 bg-secondary/5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-secondary/35 border-b border-border/30">
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Receipt ID</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Time</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Customer</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Payment Method</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Total Amount</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-foreground/45">Status</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-foreground/45">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {mockReceipts.map((rcp) => (
                <tr key={rcp.id} className="hover:bg-secondary/15 transition-colors duration-150">
                  <td className="px-5 py-4 font-mono text-xs font-black text-foreground/60">{rcp.id}</td>
                  <td className="px-5 py-4 text-xs font-bold text-foreground/70">{rcp.time}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold text-foreground">{rcp.customerName}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-secondary/40 border border-border/10 text-foreground/60 rounded-full">
                      {rcp.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-black text-indigo-500">${rcp.total.toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {rcp.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/cashier/receipt/${rcp.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-secondary/40 hover:bg-indigo-600 hover:text-white border border-border/40 hover:border-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
