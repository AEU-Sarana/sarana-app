'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../locales/en.json';
import km from '../locales/km.json';

export type Locale = 'en' | 'km';

const dictionaries: Record<Locale, any> = { en, km };
const LANG_STORAGE_KEY = 'sarana_lang';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Locale;
      if (saved && (saved === 'en' || saved === 'km')) {
        setLocaleState(saved);
      }
      setIsHydrated(true);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, newLocale);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const keys = key.split('.');
    let dict = dictionaries[locale] || dictionaries.en;
    
    for (const k of keys) {
      if (dict && typeof dict === 'object' && k in dict) {
        dict = dict[k];
      } else {
        // Fallback to English dictionary if key not found in current locale
        let fallbackDict = dictionaries.en;
        for (const fk of keys) {
          if (fallbackDict && typeof fallbackDict === 'object' && fk in fallbackDict) {
            fallbackDict = fallbackDict[fk];
          } else {
            return defaultText || key;
          }
        }
        return typeof fallbackDict === 'string' ? fallbackDict : (defaultText || key);
      }
    }

    return typeof dict === 'string' ? dict : (defaultText || key);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
