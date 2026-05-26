'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../stores';
import { clearCredentials, selectCurrentUser } from '../../features/auth/authSlice';
import LogoutModal from '../ui/logout-modal';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Read user from Redux store (hydrated from localStorage on first load)
  const user = useAppSelector(selectCurrentUser);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    dispatch(clearCredentials());
    router.push('/login');
  };

  // Helper to extract user initials
  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Grouped Sidebar Menu Items for Pharmacy POS System
  const menuGroups = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/admin/dashboard',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
          )
        },
        {
          name: 'Reports & Analytics',
          path: '/admin/reports',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Inventory & Catalog',
      items: [
        {
          name: 'Products',
          path: '/admin/products',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          )
        },
        {
          name: 'Categories',
          path: '/admin/categories',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          name: 'Stock Inventory',
          path: '/admin/stock',
          badge: 'Low Alert',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          name: 'Suppliers',
          path: '/admin/suppliers',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          name: 'Stock In',
          path: '/admin/stock-in',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Stock Adjustments',
          path: '/admin/stock-adjustments',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          )
        },
        {
          name: 'Sales History',
          path: '/admin/sales',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )
        }
      ]
    },
    {
      title: 'Security & Access',
      items: [
        {
          name: 'Users / Cashiers',
          path: '/admin/users',
          icon: (
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )
        }
      ]
    }
  ];

  return (
    <>
      {/* 1. PERSISTENT SIDEBAR - Desktop Mode */}
      <aside className={`hidden md:flex shrink-0 flex-col justify-between bg-card border-r border-border/40 shadow-xl relative z-30 transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64 lg:w-72'
      }`}>
        
        {/* Floating Expand/Collapse Border Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-8 -right-3 w-6 h-6 rounded-full bg-card border border-border/80 flex items-center justify-center text-foreground hover:bg-secondary cursor-pointer shadow-md z-30 transition-transform duration-300 hover:scale-110 active:scale-95"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg
            className={`w-3 h-3 text-foreground/50 hover:text-foreground transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Top Section: Branding & Navigation */}
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Logo & Branding */}
          <div className={`h-36 flex items-center gap-4 px-5 border-b border-border/40 select-none shrink-0 ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}>
            {/* Logo image */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg shrink-0 transition-transform duration-300 hover:scale-105">
              <Image
                src="/logo.jpg"
                alt="Pich Chamroeun Pharmacy"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            
            <div className={`flex flex-col transition-[opacity,width,transform] duration-300 ${
              isCollapsed ? 'opacity-0 w-0 overflow-hidden scale-95' : 'opacity-100 w-auto scale-100'
            }`}>
              <span className="text-sm font-extrabold tracking-tight font-sans text-foreground whitespace-nowrap leading-tight">
                Pich Chamroeun
              </span>
              <span className="text-[10px] font-semibold text-foreground/50 whitespace-nowrap leading-tight">
                Pharmacy System
              </span>
              <span className="text-[9px] font-semibold text-success flex items-center gap-1 mt-1 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                Terminal Active
              </span>
            </div>
          </div>

          {/* Navigation Menu - Scrollable */}
          <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.title} className={groupIdx > 0 ? 'mt-6' : ''}>
                {isCollapsed ? (
                  <div className="h-[1px] bg-border/40 my-4 mx-4" />
                ) : (
                  <span className="text-[10px] font-bold text-foreground/40 px-6 mb-2 block uppercase tracking-wider font-sans select-none">
                    {group.title}
                  </span>
                )}
                
                <div className="space-y-1 px-3">
                  {group.items.map((item) => {
                    const isActive = pathname ? pathname.startsWith(item.path) : false;
                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                          isCollapsed 
                            ? 'justify-center p-3 w-10 h-10 mx-auto' 
                            : 'gap-3 px-4 py-3 text-sm font-semibold'
                        } ${
                          isActive
                            ? isCollapsed
                              ? 'bg-gradient-to-tr from-primary to-accent text-white shadow-md shadow-primary/20'
                              : 'bg-gradient-to-r from-primary/10 to-accent/5 text-primary border-l-3 border-primary rounded-l-none'
                            : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground' + (!isCollapsed ? ' hover:translate-x-0.5' : '')
                        }`}
                      >
                        <span className={`shrink-0 ${isActive && isCollapsed ? 'text-white' : isActive ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground'}`}>
                          {item.icon}
                        </span>
                        
                        <span className={`font-sans font-medium transition-[opacity,max-width,transform] duration-300 ${
                          isCollapsed ? 'opacity-0 max-w-0 overflow-hidden translate-x-2' : 'opacity-100 max-w-[200px] translate-x-0'
                        } whitespace-nowrap`}>
                          {item.name}
                        </span>

                        {/* Collapsed Tooltip */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        )}
                        
                        {/* Custom Badges */}
                        {item.badge && !isCollapsed && (
                          <span className="ml-auto text-[9px] font-bold bg-warning/10 text-warning px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}

                        {/* Glow indicator on active item */}
                        {isActive && !isCollapsed && (
                          <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary"></span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section - User Session Card */}
        <div className={`p-4 border-t border-border/40 bg-secondary/10 transition-[padding] duration-300 shrink-0 ${
          isCollapsed ? 'flex flex-col items-center justify-center py-5' : ''
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-1.5 rounded-xl bg-card/50 border border-border/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border-2 border-primary/20 flex items-center justify-center font-bold text-primary relative shrink-0">
                {getInitials(user?.fullName || 'System Admin')}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full"></span>
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold truncate text-foreground leading-tight">{user?.fullName || 'System Admin'}</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-accent mt-0.5">
                  {user?.role || 'Administrator'}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                title="Logout from POS"
                className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-200 shrink-0 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="group relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border-2 border-primary/20 flex items-center justify-center font-bold text-primary relative cursor-pointer">
                {getInitials(user?.fullName || 'System Admin')}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full"></span>
              </div>

              {/* Hover User Info Card */}
              <div className="absolute bottom-0 left-full ml-4 p-4 bg-card border border-border/80 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 min-w-[200px] z-50">
                <div className="flex flex-col mb-3">
                  <span className="text-sm font-bold text-foreground">{user?.fullName || 'System Admin'}</span>
                  <span className="text-[10px] uppercase font-bold text-accent mt-0.5">{user?.role || 'Administrator'}</span>
                  <span className="text-xs text-foreground/50 mt-1 truncate">{user?.email || 'admin@gmail.com'}</span>
                </div>
                <div className="h-[1px] bg-border/40 my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center gap-2 hover:bg-destructive hover:text-white transition-all duration-150 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>

              {/* Collapsed Quick Logout Action */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-9 h-9 mt-3 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 3. COLLAPSIBLE MOBILE SLIDE-IN SIDEBAR */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          ></div>

          {/* Slide-in container */}
          <aside className="relative w-72 max-w-[290px] bg-card h-full flex flex-col justify-between border-r border-border/40 shadow-2xl animate-slide-in">
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Branding Header with Close button */}
              <div className="h-20 flex items-center justify-between px-5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-3 select-none">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
                    <Image
                      src="/logo.jpg"
                      alt="Pich Chamroeun Pharmacy"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold tracking-tight font-sans text-foreground leading-tight">Pich Chamroeun</span>
                    <span className="text-[10px] text-foreground/50 font-medium">Pharmacy System</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors duration-150 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                {menuGroups.map((group, groupIdx) => (
                  <div key={group.title} className={groupIdx > 0 ? 'mt-6' : ''}>
                    <span className="text-[10px] font-bold text-foreground/40 px-6 mb-2 block uppercase tracking-wider font-sans select-none">
                      {group.title}
                    </span>
                    
                    <div className="space-y-1 px-3">
                      {group.items.map((item) => {
                        const isActive = pathname ? pathname.startsWith(item.path) : false;
                        return (
                          <Link
                            key={item.name}
                            href={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                              isActive
                                ? 'bg-gradient-to-r from-primary/10 to-accent/5 text-primary border-l-3 border-primary rounded-l-none'
                                : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
                            }`}
                          >
                            <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground'}`}>
                              {item.icon}
                            </span>
                            
                            <span className="font-sans font-medium">{item.name}</span>
                            
                            {item.badge && (
                              <span className="ml-auto text-[9px] font-bold bg-warning/10 text-warning px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Bottom session section */}
            <div className="p-4 border-t border-border/40 bg-secondary/10 shrink-0">
              <div className="flex items-center gap-3 p-1.5 rounded-xl bg-card/50 border border-border/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border-2 border-primary/20 flex items-center justify-center font-bold text-primary relative shrink-0">
                  {getInitials(user?.fullName || 'System Admin')}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full"></span>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold truncate text-foreground leading-tight">{user?.fullName || 'System Admin'}</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-accent mt-0.5">
                    {user?.role || 'Administrator'}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-150 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
