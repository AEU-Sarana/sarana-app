'use client';

import React from 'react';
import Link from 'next/link';

export interface DashboardCardProps {
  label: string;
  value: string;
  subtext: string;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  accentColor: 'emerald' | 'indigo' | 'sky' | 'rose' | 'amber';
  href?: string;
}

export default function DashboardCard({
  label,
  value,
  subtext,
  trend,
  trendType,
  icon,
  accentColor,
  href,
}: DashboardCardProps) {
  const colorMap = {
    emerald: {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/15',
      glow: 'from-emerald-500/10 to-transparent',
    },
    indigo: {
      text: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/15',
      glow: 'from-indigo-500/10 to-transparent',
    },
    sky: {
      text: 'text-sky-500',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/15',
      glow: 'from-sky-500/10 to-transparent',
    },
    rose: {
      text: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/15',
      glow: 'from-rose-500/10 to-transparent',
    },
    amber: {
      text: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/15',
      glow: 'from-amber-500/10 to-transparent',
    },
  };

  const cfg = colorMap[accentColor];
  const className = `p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md transition-all duration-300 select-none min-h-[155px] ${
    href ? 'cursor-pointer' : ''
  }`;

  const innerContent = (
    <>
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${cfg.glow} blur-2xl transition-colors duration-300`} />
      
      <div className="flex justify-between items-start">
        <div className={`w-11 h-11 rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border ${cfg.border}`}>
          {icon}
        </div>
        
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide border ${
          trendType === 'up' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
            : trendType === 'down'
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10'
            : 'bg-secondary/40 text-foreground/50 border-border/20'
        }`}>
          {trend}
        </span>
      </div>

      <div className="mt-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] uppercase font-black text-foreground/45 tracking-widest block truncate">{label}</span>
          <span className="text-2xl font-black text-foreground block tracking-tight leading-none truncate">{value}</span>
          <span className="text-[9px] font-bold text-foreground/35 block truncate">{subtext}</span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {innerContent}
      </Link>
    );
  }

  return (
    <div className={className}>
      {innerContent}
    </div>
  );
}
