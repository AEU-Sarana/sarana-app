'use client';

import React from 'react';
import { useLanguage } from '../../contexts/language-context';

export default function LanguageSwitcher({ isCollapsed }: { isCollapsed?: boolean }) {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'km' : 'en');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={locale === 'en' ? 'Switch to Khmer (ភាសាខ្មែរ)' : 'Switch to English'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/40 bg-secondary/30 hover:bg-secondary/60 text-xs font-bold text-foreground transition-all duration-200 cursor-pointer shadow-sm ${
        isCollapsed ? 'justify-center w-10 h-10 p-0 mx-auto' : ''
      }`}
    >
      {locale === 'en' ? (
        <>
          <span className="text-sm">🇬🇧</span>
          {!isCollapsed && <span className="font-extrabold tracking-wide">EN</span>}
        </>
      ) : (
        <>
          <span className="text-sm">🇰🇭</span>
          {!isCollapsed && <span className="font-extrabold tracking-wide font-sans">ខ្មែរ</span>}
        </>
      )}
    </button>
  );
}
