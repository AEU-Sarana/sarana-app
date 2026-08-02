import { Suspense } from 'react';
import ResetPassword from '../../../components/auth/reset-password';

export const metadata = {
  title: 'Reset Password - Sarana Pharmacy POS',
  description: 'Set a new secure password for your pharmacy POS account',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground"><span className="text-muted-foreground text-sm">Loading…</span></div>}>
      <ResetPassword />
    </Suspense>
  );
}
