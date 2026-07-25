'use client';

import React from 'react';
import { LanguageProvider as ContextLanguageProvider } from '../../contexts/language-context';

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <ContextLanguageProvider>{children}</ContextLanguageProvider>;
}
