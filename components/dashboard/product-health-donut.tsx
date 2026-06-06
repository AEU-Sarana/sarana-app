'use client';

import React from 'react';

export interface ProductHealthDonutProps {
  total: number;
  lowStock: number;
  outOfStock: number;
  expired: number;
}

export default function ProductHealthDonut({
  total,
  lowStock,
  outOfStock,
  expired,
}: ProductHealthDonutProps) {
  const r = 68;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;
  const gap = 0.025 * circumference; // small gap between segments

  const inStock = Math.max(0, total - lowStock - outOfStock - expired);

  const segments = [
    { label: 'In Stock',     value: inStock,     color: '#10b981' },
    { label: 'Low Stock',    value: lowStock,    color: '#f59e0b' },
    { label: 'Out of Stock', value: outOfStock,  color: '#f43f5e' },
    { label: 'Expired',      value: expired,     color: '#f97316' },
  ];

  const totalVal = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  let accOffset = 0;
  const arcs = segments.map((seg) => {
    const len = Math.max(0, (seg.value / totalVal) * circumference - gap);
    const dasharray = `${len} ${circumference - len}`;
    const dashoffset = circumference - accOffset;
    accOffset += len + gap;
    return { ...seg, dasharray, dashoffset };
  });

  const pct = (v: number) => totalVal > 0 ? Math.round((v / totalVal) * 100) : 0;

  return (
    <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-full select-none">
      {/* Header */}
      <div>
        <h2 className="text-base font-black text-foreground tracking-tight">Product Health</h2>
        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">Stock status breakdown</p>
      </div>

      {/* Donut SVG */}
      <div className="flex justify-center">
        <div className="relative w-[280px] h-[280px]">
          <svg viewBox="0 0 200 200" width="280" height="280">
            {/* Track ring */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="26"
              className="text-secondary/25"
            />
            {/* Colored segments */}
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth="26"
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                strokeLinecap="butt"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: 'stroke-dasharray 0.6s ease',
                }}
              />
            ))}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-foreground leading-none">{total}</span>
            <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mt-1">Products</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-1">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-[10px] font-bold text-foreground/55 truncate">{arc.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-black text-foreground">{arc.value}</span>
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: arc.color + '22', color: arc.color }}
              >
                {pct(arc.value)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
