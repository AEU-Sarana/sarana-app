'use client';

import React from 'react';
import { Product } from '../../features/product/types';
import { useLanguage } from '../../contexts/language-context';

interface ProductCardProps {
  product: Product;
  cartQty: number;
  onAddToCart: (product: Product) => void;
}

// Unique Color generation helper for medicines avatar
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export default function ProductCard({
  product,
  cartQty,
  onAddToCart,
}: ProductCardProps) {
  const { t } = useLanguage();
  const isOutOfStock = product.stock_quantity <= 0;
  const isCartLimitReached = cartQty >= product.stock_quantity;
  const lowStock = product.low_stock_threshold !== null && product.stock_quantity < product.low_stock_threshold;
  const avatarStyle = getAvatarColor(product.product_name);

  return (
    <div
      onClick={() => {
        if (!isOutOfStock && !isCartLimitReached) {
          onAddToCart(product);
        }
      }}
      className={`bg-card border rounded-3xl p-4 shadow-sm relative overflow-hidden group select-none transition-all duration-300 ${
        isOutOfStock
          ? 'opacity-65 border-border/30 cursor-not-allowed'
          : isCartLimitReached
          ? 'border-primary/30 cursor-default'
          : 'border-border/40 hover:-translate-y-1 hover:shadow-md hover:border-primary/25 cursor-pointer'
      }`}
    >
      {/* Cart Quantity Indicator Badge */}
      {cartQty > 0 && (
        <div className="absolute top-2.5 right-2.5 bg-primary text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm shadow-primary/20 z-10 animate-scale-up">
          {cartQty} {t('pos.in_cart', 'in Cart')}
        </div>
      )}

      {/* Product visual box fallback */}
      <div className={`w-full aspect-[4/3] rounded-2xl border flex items-center justify-center font-black text-xl mb-3 shrink-0 select-none ${avatarStyle}`}>
        {product.image_path ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image_path}
            alt={product.product_name}
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          product.product_name.substring(0, 2).toUpperCase()
        )}
      </div>

      {/* Product details */}
      <div className="space-y-1">
        <div className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider truncate">
          {product.category || 'Medicine'}
        </div>
        <h3 className="text-sm font-extrabold text-foreground tracking-tight leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {product.product_name}
        </h3>
        
        {/* Price & Stock Badge */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-black text-primary tracking-tight">
            ${product.price.toFixed(2)}
          </span>
          
          {/* Stock status indicator */}
          {isOutOfStock ? (
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/10">
              {t('pos.out_of_stock', 'Out of Stock')}
            </span>
          ) : lowStock ? (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/10">
              {t('pos.low_stock', 'Low')}: {product.stock_quantity}
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
              {t('pos.stock', 'Stock')}: {product.stock_quantity}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
