'use client';

import React from 'react';
import { StockStatus } from '../../features/stock/types';
import { useLanguage } from '../../contexts/language-context';

interface StockStatusBadgeProps {
  status: StockStatus;
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const { t } = useLanguage();

  const STATUS_CONFIG: Record<StockStatus, { labelKey: string; defaultLabel: string; cls: string; dot: string }> = {
    in_stock:     { labelKey: 'dashboard.in_stock', defaultLabel: 'In Stock', cls: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
    low_stock:    { labelKey: 'dashboard.low_stock', defaultLabel: 'Low Stock', cls: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
    out_of_stock: { labelKey: 'dashboard.out_of_stock', defaultLabel: 'Out of Stock', cls: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
    negative:     { labelKey: 'reports.negative_stock', defaultLabel: 'Negative', cls: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_stock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(cfg.labelKey, cfg.defaultLabel)}
    </span>
  );
}
