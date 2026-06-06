'use client';

import React from 'react';
import { StockStatus } from '../../features/stock/types';

const STATUS_CONFIG: Record<StockStatus, { label: string; cls: string; dot: string }> = {
  in_stock: { label: 'In Stock', cls: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  low_stock: { label: 'Low Stock', cls: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  negative: { label: 'Negative', cls: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
};

interface StockStatusBadgeProps {
  status: StockStatus;
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_stock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
