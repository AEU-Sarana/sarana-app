'use client';

import React from 'react';
import { Product } from '../../features/product/types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const getPlaceholderGradient = (name: string) => {
  const colors = [
    'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    'from-pink-500/10 to-rose-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  const gradClass = getPlaceholderGradient(product.product_name);
  
  // Expiry styling helper
  const getExpiryDetails = (hasExpiry?: boolean, expiredAt?: string | null) => {
    if (!hasExpiry || !expiredAt) return { label: 'Not Tracked', color: 'text-foreground/40' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expiredAt);
    expiryDate.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const dateStr = expiryDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (diffDays < 0) {
      return { 
        label: `${dateStr} (Expired)`, 
        color: 'text-destructive font-bold' 
      };
    } else if (diffDays <= 30) {
      return { 
        label: `${dateStr} (Expires in ${diffDays}d)`, 
        color: 'text-warning font-bold' 
      };
    }
    
    return { 
      label: dateStr, 
      color: 'text-foreground font-semibold' 
    };
  };

  const expiryDetails = getExpiryDetails(product.has_expiry, product.expired_at);
  const isLowStock = product.low_stock_threshold !== null && product.stock_quantity < product.low_stock_threshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border/40 shadow-sm overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-border/30 flex justify-between items-center select-none bg-secondary/15">
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight">Product Details</h3>
            <p className="text-[10px] text-foreground/45 mt-0.5">Catalog record review</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-foreground/45 hover:text-foreground transition-colors cursor-pointer"
            title="Close Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Top Section: Photo / Fallback & Essential Identifiers */}
          <div className="flex gap-4.5 items-start">
            <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center relative border border-border/30 shrink-0 select-none shadow-sm bg-secondary/10">
              {product.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_path}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradClass} flex items-center justify-center border font-bold text-2xl`}>
                  {product.product_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-foreground/50 bg-secondary/40 border border-border/20 px-1.5 py-0.5 rounded">
                  ID: #{product.product_id}
                </span>
                
                {product.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-success/15 text-success border border-success/10">
                    <span className="w-1 h-1 rounded-full bg-success shrink-0 animate-pulse"></span>
                    ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-secondary/60 text-foreground/45 border border-border/20">
                    <span className="w-1 h-1 rounded-full bg-foreground/30 shrink-0"></span>
                    INACTIVE
                  </span>
                )}
              </div>

              <h4 className="text-base font-extrabold text-foreground leading-snug break-words">
                {product.product_name}
              </h4>
              
              {product.category && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-secondary/60 text-foreground/75 border border-border/20 rounded-md">
                  {product.category}
                </span>
              )}
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4.5">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-foreground/40 block">Product Code</span>
              <span className="text-xs font-mono font-bold text-foreground block mt-1 bg-secondary/30 px-2 py-1 rounded border border-border/20 w-max max-w-full truncate">
                {product.product_code || '-'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-foreground/40 block">Barcode / SKU</span>
              <span className="text-xs font-mono font-bold text-foreground block mt-1 bg-secondary/30 px-2 py-1 rounded border border-border/20 w-max max-w-full truncate">
                {product.barcode || '-'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-foreground/40 block">Price</span>
              <span className="text-base font-black text-foreground block mt-1">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-foreground/40 block">Stock Level</span>
              <div className="flex items-center gap-2 mt-1 select-none">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  product.stock_quantity <= 0
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : isLowStock
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-success/10 text-success border-success/20'
                }`}>
                  {product.stock_quantity} units
                </span>
                {isLowStock && (
                  <span className="text-[9px] font-bold text-warning leading-none">
                    (Threshold: {product.low_stock_threshold})
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2 border-t border-border/10 pt-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-foreground/40 block">Expiry Date</span>
              <span className={`text-xs block mt-1 ${expiryDetails.color}`}>
                {expiryDetails.label}
              </span>
            </div>
          </div>

          {/* Description Block */}
          <div className="border-t border-border/20 pt-4.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-foreground/40 block">Description / Note</span>
            <p className="text-xs text-foreground/75 leading-relaxed mt-2.5 whitespace-pre-wrap bg-secondary/15 dark:bg-secondary/5 p-3 rounded-xl border border-border/20">
              {product.description || 'No additional description or parameter notes registered for this item.'}
            </p>
          </div>

          {/* History Details */}
          <div className="border-t border-border/20 pt-4.5 grid grid-cols-2 gap-4 text-[10px] font-medium text-foreground/40 select-none">
            <div>
              <span>Created At:</span>
              <span className="block mt-0.5 font-semibold text-foreground/50">
                {new Date(product.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span>Last Modified:</span>
              <span className="block mt-0.5 font-semibold text-foreground/50">
                {new Date(product.updated_at).toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border/30 bg-secondary/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 border border-border/50 hover:border-border text-foreground text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer hover:scale-102 active:scale-98"
          >
            Close details
          </button>
        </div>

      </div>
    </div>
  );
}
