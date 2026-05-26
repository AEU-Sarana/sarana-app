'use client';

import React from 'react';

export default function VerifyOtp() {
  return (
    <div className="p-8 bg-card border border-border/40 rounded-2xl shadow-xl max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
      <p className="text-muted-foreground text-sm">Enter the code sent to your email.</p>
    </div>
  );
}
