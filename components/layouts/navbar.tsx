'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../stores';
import { clearCredentials, selectCurrentUser, updateUser } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';
import LogoutModal from '../ui/logout-modal';
import ThemeToggle from '../ui/theme-toggle';
import LanguageSwitcher from '../ui/language-switcher';
import { getInitials } from '../../libs/utils';
import { useLanguage } from '../../contexts/language-context';

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, { titleKey: string; defaultTitle: string; subtitleKey: string; defaultSubtitle: string }> = {
  '/admin/dashboard':         { titleKey: 'header.dashboard_title',  defaultTitle: 'Dashboard',          subtitleKey: 'header.dashboard_subtitle',  defaultSubtitle: 'Overview of your pharmacy operations' },
  '/admin/reports':           { titleKey: 'header.reports_title',    defaultTitle: 'Reports & Analytics', subtitleKey: 'header.reports_subtitle',    defaultSubtitle: 'Sales performance and business insights' },
  '/admin/products':          { titleKey: 'header.products_title',   defaultTitle: 'Products',            subtitleKey: 'header.products_subtitle',   defaultSubtitle: 'Manage your product catalog' },
  '/admin/categories':        { titleKey: 'header.categories_title', defaultTitle: 'Product Categories',   subtitleKey: 'header.categories_subtitle', defaultSubtitle: 'Organize and classify your medicine catalog' },
  '/admin/stock':             { titleKey: 'header.stock_title',      defaultTitle: 'Stock Inventory',     subtitleKey: 'header.stock_subtitle',      defaultSubtitle: 'Track stock levels and expiry dates' },
  '/admin/sales':             { titleKey: 'header.sales_title',      defaultTitle: 'Sales History',       subtitleKey: 'header.sales_subtitle',      defaultSubtitle: 'Review past transactions' },
  '/admin/users':             { titleKey: 'header.users_title',      defaultTitle: 'Users & Cashiers',    subtitleKey: 'header.users_subtitle',      defaultSubtitle: 'Manage staff access and roles' },
  '/admin/settings':          { titleKey: 'settings.title',          defaultTitle: 'Application Settings', subtitleKey: 'settings.subtitle',         defaultSubtitle: 'Configure backup, report delivery, and invoice information.' },
  '/admin/profile':           { titleKey: 'profile.title',           defaultTitle: 'Account Profile',     subtitleKey: 'profile.subtitle',         defaultSubtitle: 'Manage your personal account information, bio details, and update security passwords.' },
  '/cashier/checkout':        { titleKey: 'pos.title',               defaultTitle: 'Checkout POS Terminal', subtitleKey: 'header.checkout_subtitle', defaultSubtitle: 'Search products, manage cart items, associate customer accounts, and record retail pharmacy sales' },
  '/cashier/dashboard':       { titleKey: 'header.dashboard_title',  defaultTitle: 'Dashboard',          subtitleKey: 'header.dashboard_subtitle',  defaultSubtitle: 'Overview of your pharmacy operations' },
};

function getPageInfo(pathname: string | null, t: (key: string, def?: string) => string) {
  if (!pathname) return { title: t('header.dashboard_title', 'Dashboard'), subtitle: '' };
  const match = Object.keys(PAGE_TITLES).find((key) => pathname.startsWith(key));
  if (!match) return { title: t('header.dashboard_title', 'Dashboard'), subtitle: '' };
  const info = PAGE_TITLES[match];
  return {
    title: t(info.titleKey, info.defaultTitle),
    subtitle: t(info.subtitleKey, info.defaultSubtitle),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === 'ADMIN';
  const { t } = useLanguage();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync user profile details from /me endpoint on mount
  useEffect(() => {
    if (user) {
      authService.getMe()
        .then((res) => {
          if (res?.success && res?.data) {
            dispatch(
              updateUser({
                fullName: res.data.fullName,
                email: res.data.email,
              })
            );
          }
        })
        .catch((err) => {
          console.error('Failed to sync user session via /me:', err);
        });
    }
  }, [dispatch]);

  const { title, subtitle } = getPageInfo(pathname, t);
  const initials = getInitials(user?.fullName || 'Admin');

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    dispatch(clearCredentials());
    router.push('/login');
  };

  return (
    <>
      {/* ── Desktop Navbar (hidden on mobile) ── */}
      <header className="hidden md:flex h-20 shrink-0 bg-card border-b border-border/40 items-center justify-between px-6 lg:px-8 relative z-20">

        {/* LEFT — Page title + subtitle */}
        <div className="flex flex-col justify-center">
          <h1 className="text-lg font-extrabold text-foreground leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-foreground/45 font-medium leading-none mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* RIGHT — Theme selector, Language Switcher & Avatar dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="navbar-avatar-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-secondary/50 transition-all duration-150 cursor-pointer"
            >
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-sm font-extrabold text-white shadow-md shadow-primary/20 relative shrink-0">
                {initials}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full" />
              </div>

              {/* Name + role */}
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-foreground leading-tight max-w-[140px] truncate">
                  {user?.fullName || 'Admin'}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent leading-none mt-0.5">
                  {user?.role || 'Administrator'}
                </span>
              </div>

              {/* Chevron */}
              <svg
                className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50 animate-scale-up">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-border/40 bg-secondary/20">
                  <p className="text-sm font-bold text-foreground truncate">{user?.fullName || 'Admin'}</p>
                  <p className="text-xs text-foreground/50 truncate mt-0.5">{user?.email || ''}</p>
                </div>

                {/* Actions */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    href="/admin/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-foreground/85 hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
                  >
                    <svg className="w-4 h-4 shrink-0 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-foreground/85 hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
                    >
                      <svg className="w-4 h-4 shrink-0 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  )}

                  <div className="h-[1px] bg-border/40 my-1" />

                  <button
                    id="navbar-logout-btn"
                    onClick={() => { setDropdownOpen(false); setIsLogoutModalOpen(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all duration-150 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
