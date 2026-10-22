'use client';

import React from 'react';
import { AuditStats } from '../../services/auditLogService';

interface AuditLogStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AuditStats | null;
  isLoading: boolean;
}

export function AuditLogStatsModal({
  isOpen,
  onClose,
  stats,
  isLoading,
}: AuditLogStatsModalProps) {
  if (!isOpen) return null;

  const maxActionCount = Math.max(...(stats?.topActions?.map((a) => a.count) || [1]));
  const maxTimelineCount = Math.max(...(stats?.timeline?.map((t) => t.count) || [1]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                Audit Trail Intelligence & Analytics
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                Activity distribution, staff workload, and historical event trends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground/60 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoading || !stats ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs text-foreground/50 font-medium">Computing audit statistics...</span>
            </div>
          ) : (
            <>
              {/* 1. 7-Day Timeline Bar Chart */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/60 block mb-3">
                  Recent 7-Day Activity Volume
                </span>
                <div className="bg-secondary/15 p-4 rounded-2xl border border-border/40">
                  <div className="flex items-end justify-between gap-2 h-32 pt-4">
                    {stats.timeline.map((item) => {
                      const heightPercent = maxTimelineCount > 0 ? (item.count / maxTimelineCount) * 100 : 0;
                      const dateObj = new Date(item.date);
                      const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' });

                      return (
                        <div key={item.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <span className="text-[10px] font-bold text-foreground/60 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                          <div className="w-full max-w-[28px] bg-primary/20 group-hover:bg-primary transition-colors rounded-t-lg relative" style={{ height: `${Math.max(heightPercent, 8)}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-primary/40 rounded-t-lg" />
                          </div>
                          <span className="text-[10px] font-semibold text-foreground/50 mt-2 select-none">
                            {dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Top Actions Breakdown */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/60 block mb-3">
                  Top Operations
                </span>
                <div className="space-y-2.5">
                  {stats.topActions.map((actionItem) => {
                    const percent = maxActionCount > 0 ? Math.round((actionItem.count / maxActionCount) * 100) : 0;

                    return (
                      <div key={actionItem.action} className="bg-secondary/15 p-3 rounded-xl border border-border/40">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5 font-mono">
                          <span>{actionItem.action}</span>
                          <span className="text-foreground/60">{actionItem.count.toLocaleString()} calls</span>
                        </div>
                        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Top Active Staff */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/60 block mb-3">
                  Most Active Staff Members
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.topUsers.map((userItem) => (
                    <div
                      key={userItem.userId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/40"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border border-border/60 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {userItem.fullName?.[0]?.toUpperCase() || userItem.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-xs font-bold text-foreground truncate">
                          {userItem.fullName || userItem.username}
                        </div>
                        <div className="text-[10px] text-foreground/50 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-primary font-bold">
                            {userItem.count} actions
                          </span>
                          <span>&bull;</span>
                          <span className="uppercase">{userItem.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-secondary/10 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
