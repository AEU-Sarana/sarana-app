'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CashierIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cashier/dashboard');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-28 gap-4 bg-background">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <span className="text-sm font-bold text-foreground/50 tracking-wide">Redirecting to cashier dashboard...</span>
    </div>
  );
}
