'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '../services/tokenStorage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = tokenStorage.getUser();
    const token = tokenStorage.getAccessToken();

    if (token && user) {
      const uRole = (user.role || '').toUpperCase();
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      const hasDashboard =
        uRole === 'ADMINISTRATOR' ||
        perms.some((p: any) => (typeof p === 'string' ? p === 'dashboard.view' : p?.featureKey === 'dashboard.view')) ||
        (uRole === 'ADMIN' && perms.length === 0);

      if (uRole === 'ADMIN' || uRole === 'ADMINISTRATOR') {
        router.replace(hasDashboard ? '/admin/dashboard' : '/admin/products');
      } else {
        router.replace(hasDashboard ? '/cashier/dashboard' : '/cashier/checkout');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background select-none">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-foreground/50">Redirecting to Pich Chamroeun POS...</p>
      </div>
    </div>
  );
}
