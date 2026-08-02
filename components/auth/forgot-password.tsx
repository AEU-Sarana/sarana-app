'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await authService.forgotPassword(identifier.trim());
            setSent(true);
            // Brief pause so user sees the success state, then navigate
            setTimeout(() => {
                router.push(`/verify-otp?identifier=${encodeURIComponent(identifier.trim())}`);
            }, 1200);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">

            {/* LEFT COLUMN: Visual Branding */}
            <div className="hidden md:flex md:w-[40%] flex-col justify-between p-12 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent),transparent),radial-gradient(ellipse_at_bottom_left,var(--color-primary),transparent)] bg-primary text-primary-foreground relative overflow-hidden isolate">

                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
                <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDuration: '8s' }}></div>
                <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDuration: '10s', animationDelay: '3s' }}></div>

                {/* Top: Logo & Title */}
                <div className="flex items-center gap-3 relative z-10 select-none">
                    <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shadow-sm shadow-black/15 border border-white/20 transition-transform duration-300 hover:scale-105">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 10.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9.5M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-xl font-extrabold tracking-wider uppercase bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent drop-shadow-sm">
                        Sarana Pharmacy
                    </span>
                </div>

                {/* Center: Heading */}
                <div className="my-auto relative z-10 max-w-sm">
                    {/* Lock icon illustration */}
                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-xl backdrop-blur-sm">
                        <svg className="w-10 h-10 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a3 3 0 0 0-6 0v3H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2V7z" />
                            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-md bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
                        Account Recovery
                    </h1>
                    <p className="text-white/80 leading-relaxed font-sans text-sm font-medium">
                        Enter your registered email address and we'll send a one-time password to your inbox.
                    </p>
                </div>

                {/* Bottom: Steps */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative z-10 shadow-xl shadow-black/5 hover:border-white/15 transition-all duration-300">
                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-white/90 mb-3.5">
                        Recovery Steps
                    </h3>
                    <ul className="space-y-3 text-sm font-sans text-white/85">
                        {[
                            { step: '1', label: 'Enter your email address' },
                            { step: '2', label: 'Verify the 6-digit OTP code' },
                            { step: '3', label: 'Set a new secure password' },
                        ].map(({ step, label }) => (
                            <li key={step} className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-xs text-white border border-white/20 shadow-sm font-bold shrink-0">
                                    {step}
                                </span>
                                <span className="font-medium">{label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT COLUMN: Form */}
            <div className="w-full md:w-[60%] flex items-center justify-center p-6 sm:p-12 bg-background relative">
                <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-card border border-border/40 shadow-2xl rounded-2xl p-8 sm:p-10 transition-all duration-300 hover:shadow-primary/5 hover:border-border/80">

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-extrabold tracking-tight mb-2">Forgot Password?</h2>
                            <p className="text-muted-foreground text-sm font-sans">
                                Enter your email address and we'll send you an OTP code.
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start gap-3">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Alert */}
                        {sent && (
                            <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm flex items-start gap-3">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>OTP sent! Redirecting to verification…</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-muted-foreground font-sans">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </span>
                                    <input
                                        id="forgot-identifier"
                                        type="email"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="name@pharmacy.com"
                                        autoComplete="email"
                                        disabled={isLoading || sent}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border/60 rounded-xl text-sm font-sans focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 group-hover:border-border disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <button
                                id="forgot-submit-btn"
                                type="submit"
                                disabled={isLoading || sent}
                                className="w-full mt-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-sm shadow-primary/20 hover:bg-primary-hover hover:shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Sending OTP…</span>
                                    </>
                                ) : sent ? (
                                    <span>OTP Sent ✓</span>
                                ) : (
                                    <span>Send OTP</span>
                                )}
                            </button>
                        </form>

                        {/* Back to login */}
                        <div className="mt-6 text-center">
                            <a
                                href="/login"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors duration-150"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Sign In
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
