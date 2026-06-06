'use client';

import React from 'react';

interface MovementBadgeProps {
  type: string;
}

export function MovementBadge({ type }: MovementBadgeProps) {
  const map: Record<string, { label: string; cls: string }> = {
    STOCK_IN:   { label: 'Stock In',    cls: 'bg-success/10 text-success border-success/20' },
    ADJUSTMENT: { label: 'Adjustment',  cls: 'bg-amber-500/10 text-amber-600 border-amber-300/20' },
    SALE:       { label: 'Sale',        cls: 'bg-primary/10 text-primary border-primary/20' },
    RETURN:     { label: 'Return',      cls: 'bg-accent/10 text-accent border-accent/20' },
    EXPIRED:    { label: 'Expired',     cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  };
  const cfg = map[type] || { label: type, cls: 'bg-secondary/20 text-foreground/50 border-border/30' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
