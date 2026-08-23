import { Suspense } from 'react';
import VerifyOtp from '../../../components/auth/verify-otp';

export const metadata = {
  title: 'Verify OTP - Pich Chamroeun POS',
  description: 'Enter the OTP code sent to your email to verify your identity',
};

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground"><span className="text-muted-foreground text-sm">Loading…</span></div>}>
      <VerifyOtp />
    </Suspense>
  );
}
