'use client';

import React from 'react';
import Link from 'next/link';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  feature?: string;
}

export default function AccessDenied({
  title = 'Administrator Clearance Required',
  message = 'This module is restricted exclusively to System Administrators. Store Admins and general staff cannot access User Management, Roles & Permissions, App Settings, Backups, or Audit Logs.',
  feature,
}: AccessDeniedProps) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-card border border-border/60 rounded-3xl p-8 text-center shadow-xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          {feature && (
            <span className="inline-block px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-black uppercase tracking-wider">
              {feature}
            </span>
          )}
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h2>
          <p className="text-xs text-foreground/60 leading-relaxed font-medium">{message}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {feature?.toLowerCase().includes('dashboard') ? (
            <Link
              href="/cashier/checkout"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all duration-150 shadow-md shadow-primary/20 text-center"
            >
              Go to Checkout POS
            </Link>
          ) : (
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all duration-150 shadow-md shadow-primary/20 text-center"
            >
              Back to Dashboard
            </Link>
          )}
          <Link
            href="/admin/products"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all duration-150 text-center"
          >
            Product Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
