'use client';

import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../../stores';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * StoreProvider — wraps the entire app in the Redux Provider.
 *
 * We use a ref so the store is only created once per browser session (not
 * recreated on every render) while still satisfying React strict-mode rules.
 *
 * In Next.js App Router:
 *  - This component itself is a Client Component ('use client').
 *  - The root layout (server component) can import it without becoming a
 *    client component itself — only this wrapper and its children opt-in.
 */
export default function StoreProvider({ children }: StoreProviderProps) {
  const storeRef = useRef<AppStore | null>(null);

  // Lazily initialise the store on the first render
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
