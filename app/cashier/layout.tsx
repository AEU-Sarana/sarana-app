'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layouts/sidebar';
import Navbar from '../../components/layouts/navbar';
import ThemeToggle from '../../components/ui/theme-toggle';
import LanguageSwitcher from '../../components/ui/language-switcher';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync sidebar collapse preference with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cashier_sidebar_collapsed');
    if (saved) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('cashier_sidebar_collapsed', String(next));
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Modular Collapsible Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleCollapse={toggleCollapse} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Desktop Top Navbar */}
        <Navbar />

        {/* Mobile Top Navbar Header */}
        <header className="md:hidden h-16 shrink-0 bg-card border-b border-border/40 flex items-center justify-between px-4 relative z-30">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 active:scale-95 transition-all duration-150 cursor-pointer"
            title="Open Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2 select-none">
            <span className="text-sm font-extrabold tracking-wider uppercase bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Pich Chamroeun
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
