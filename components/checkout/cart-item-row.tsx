'use client';

import React from 'react';
import { Product } from '../../features/product/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: CartItemRowProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 bg-secondary/25 dark:bg-secondary/5 border border-border/30 rounded-2xl relative group"
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-extrabold text-foreground truncate leading-tight">
          {item.product.product_name}
        </h4>
        <span className="text-xs font-bold text-primary tracking-tight mt-1 block">
          ${item.product.price.toFixed(2)} / unit
        </span>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center border border-border/60 rounded-xl bg-card overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => onUpdateQty(item.product.product_id, -1)}
          className="px-3 py-1.5 text-xs font-bold text-foreground/60 hover:text-foreground hover:bg-secondary/50 cursor-pointer focus:outline-none"
        >
          -
        </button>
        <span className="px-3 py-1.5 text-xs font-black text-foreground min-w-[28px] text-center select-none bg-secondary/10">
          {item.quantity}
        </span>
        <button
          type="button"
          disabled={item.quantity >= item.product.stock_quantity}
          onClick={() => onUpdateQty(item.product.product_id, 1)}
          className="px-3 py-1.5 text-xs font-bold text-foreground/60 hover:text-foreground hover:bg-secondary/50 cursor-pointer focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      {/* Subtotal of line item */}
      <div className="text-sm font-black text-foreground tracking-tight w-16 text-right select-none">
        ${(item.product.price * item.quantity).toFixed(2)}
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={() => onRemove(item.product.product_id)}
        title="Remove item"
        className="w-8.5 h-8.5 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-150 shrink-0 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
