'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext: string;
  icon: React.ReactNode;
  accentCls: string;
  bgCls: string;
  hoverShadowCls: string;
  glowCls: string;
  borderCls: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  accentCls,
  bgCls,
  hoverShadowCls,
  glowCls,
  borderCls,
}: StatCardProps) {
  return (
    <div className={`p-6 bg-card border border-border/40 rounded-3xl shadow-sm flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 hover:shadow-sm ${hoverShadowCls} transition-all duration-300 select-none`}>
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${glowCls} blur-2xl transition-colors duration-300`} />
      <div className={`w-13 h-13 rounded-2xl ${bgCls} ${accentCls} flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border ${borderCls}`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] uppercase font-black text-foreground/40 tracking-widest block">{label}</span>
        <span className="text-2xl font-black text-foreground mt-1 block tracking-tight leading-none">{value}</span>
        <span className="text-[9px] font-semibold text-foreground/35 mt-1 block">{subtext}</span>
      </div>
    </div>
  );
}
