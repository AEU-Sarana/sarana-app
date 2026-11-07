'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '../../services/tokenStorage';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const user = tokenStorage.getUser();
    const uRole = (user?.role || '').toUpperCase();
    const perms = Array.isArray(user?.permissions) ? user.permissions : [];
    const hasDashboard =
      uRole === 'ADMINISTRATOR' ||
      perms.some((p: any) => (typeof p === 'string' ? p === 'dashboard.view' : p?.featureKey === 'dashboard.view')) ||
      (uRole === 'ADMIN' && perms.length === 0);

    router.replace(hasDashboard ? '/admin/dashboard' : '/admin/products');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-28 gap-4 bg-background">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <span className="text-sm font-bold text-foreground/50 tracking-wide">Redirecting...</span>
    </div>
  );
}
