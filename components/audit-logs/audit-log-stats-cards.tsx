'use client';

import React from 'react';
import { AuditStats } from '../../services/auditLogService';

interface AuditLogStatsCardsProps {
  stats: AuditStats | null;
  isLoading: boolean;
  onOpenAnalytics: () => void;
}

export function AuditLogStatsCards({ stats, isLoading, onOpenAnalytics }: AuditLogStatsCardsProps) {
  const topAction = stats?.topActions?.[0];
  const activeUsersCount = stats?.topUsers?.length || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Events */}
      <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Total Events</span>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-8 w-24 bg-secondary/40 animate-pulse rounded-lg" />
          ) : (
            <span className="text-2xl font-black text-foreground tracking-tight">
              {(stats?.totalLogs ?? 0).toLocaleString()}
            </span>
          )}
          <span className="text-xs text-foreground/50">logged entries</span>
        </div>
      </div>

      {/* 2. Today's Events */}
      <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Today's Activity</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-8 w-20 bg-secondary/40 animate-pulse rounded-lg" />
          ) : (
            <span className="text-2xl font-black text-emerald-500 tracking-tight">
              +{(stats?.todayLogs ?? 0).toLocaleString()}
            </span>
          )}
          <span className="text-xs text-foreground/50">records today</span>
        </div>
      </div>

      {/* 3. Active Users */}
      <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Active Actors</span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-8 w-16 bg-secondary/40 animate-pulse rounded-lg" />
          ) : (
            <span className="text-2xl font-black text-foreground tracking-tight">
              {activeUsersCount}
            </span>
          )}
          <span className="text-xs text-foreground/50">staff members</span>
        </div>
      </div>

      {/* 4. Top Action + Analytics trigger */}
      <div
        onClick={onOpenAnalytics}
        className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Top Operation</span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {isLoading ? (
            <div className="h-8 w-28 bg-secondary/40 animate-pulse rounded-lg" />
          ) : (
            <div className="truncate">
              <span className="text-sm font-black text-foreground truncate block font-mono">
                {topAction?.action || 'None'}
              </span>
              <span className="text-xs text-foreground/50">{topAction?.count ? `${topAction.count} calls` : 'No data'}</span>
            </div>
          )}
          <span className="text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Trends &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
