'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder while mounting to prevent Next.js hydration flashes
    return (
      <div className="w-9 h-9 rounded-xl bg-secondary/35 border border-border/20 animate-pulse" />
    );
  }

  // Resolve system setting internally
  const activeTheme = theme === 'system' ? resolvedTheme : theme;

  const handleToggle = () => {
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      title={activeTheme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="w-9 h-9 rounded-xl bg-secondary/35 hover:bg-secondary/70 border border-border/20 flex items-center justify-center text-foreground/75 hover:text-foreground cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95"
    >
      {activeTheme === 'dark' ? (
        <svg className="w-4.5 h-4.5 animate-scale-up text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 animate-scale-up text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )}
    </button>
  );
}
