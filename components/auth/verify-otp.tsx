'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../services/authService';

const OTP_LENGTH = 6;

export default function VerifyOtp() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const identifier = searchParams.get('identifier') ?? '';

    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const otpCode = digits.join('');
    const isComplete = otpCode.length === OTP_LENGTH && digits.every(Boolean);

    const handleChange = (index: number, value: string) => {
        const char = value.replace(/\D/g, '').slice(-1); // digits only, last char
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        setError(null);

        // Move focus forward
        if (char && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (digits[index]) {
                const next = [...digits];
                next[index] = '';
                setDigits(next);
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                const next = [...digits];
                next[index - 1] = '';
                setDigits(next);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = Array(OTP_LENGTH).fill('');
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        setDigits(next);
        const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComplete) return;
        setError(null);
        setIsLoading(true);

        try {
            await authService.verifyOtp(identifier, otpCode);
            router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`);
        } catch (err: any) {
            setError(err.message || 'Invalid or expired OTP. Please try again.');
            setDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setIsResending(true);
        setError(null);
        try {
            await authService.forgotPassword(identifier);
            setResendCooldown(60);
            setDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">

            {/* LEFT COLUMN: Visual Branding */}
            <div className="hidden md:flex md:w-[40%] flex-col justify-between p-12 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent),transparent),radial-gradient(ellipse_at_bottom_left,var(--color-primary),transparent)] bg-primary text-primary-foreground relative overflow-hidden isolate">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
                <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDuration: '8s' }}></div>
                <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDuration: '10s', animationDelay: '3s' }}></div>

                <div className="flex items-center gap-3 relative z-10 select-none">
                    <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shadow-sm shadow-black/15 border border-white/20 transition-transform duration-300 hover:scale-105 overflow-hidden p-0.5">
                        <img src="/logo.jpg" alt="Pich Chamroeun Logo" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <span className="text-xl font-extrabold tracking-wider uppercase bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent drop-shadow-sm">
                        Pich Chamroeun
                    </span>
                </div>

                <div className="my-auto relative z-10 max-w-sm">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-xl backdrop-blur-sm">
                        <svg className="w-10 h-10 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-md bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
                        Check Your Email
                    </h1>
                    <p className="text-white/80 leading-relaxed font-sans text-sm font-medium">
                        We sent a 6-digit OTP to your registered email address. Enter it to proceed with resetting your password.
                    </p>
                    {identifier && (
                        <div className="mt-4 bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-white/90 text-sm font-mono font-semibold truncate">{identifier}</span>
                        </div>
                    )}
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative z-10 shadow-xl shadow-black/5">
                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-white/90 mb-3.5">Recovery Steps</h3>
                    <ul className="space-y-3 text-sm font-sans text-white/85">
                        {[
                            { step: '1', label: 'Enter your email or username', done: true },
                            { step: '2', label: 'Verify the 6-digit OTP code', active: true },
                            { step: '3', label: 'Set a new secure password', done: false },
                        ].map(({ step, label, done, active }) => (
                            <li key={step} className="flex items-center gap-3">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white border shadow-sm font-bold shrink-0 ${done ? 'bg-success/70 border-success/50' : active ? 'bg-white/25 border-white/30' : 'bg-white/10 border-white/15'}`}>
                                    {done ? '✓' : step}
                                </span>
                                <span className={`font-medium ${active ? 'text-white' : done ? 'text-white/60 line-through' : 'text-white/60'}`}>{label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT COLUMN: OTP Form */}
            <div className="w-full md:w-[60%] flex items-center justify-center p-6 sm:p-12 bg-background relative">
                <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-card border border-border/40 shadow-2xl rounded-2xl p-8 sm:p-10 transition-all duration-300 hover:shadow-primary/5 hover:border-border/80">

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-extrabold tracking-tight mb-2">Enter OTP Code</h2>
                            <p className="text-muted-foreground text-sm font-sans">
                                We sent a 6-digit code to <span className="font-semibold text-foreground">{identifier || 'your email'}</span>. It expires in 15 minutes.
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

                        {/* OTP Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 6-Digit OTP Boxes */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-bold mb-4 text-muted-foreground font-sans">
                                    Verification Code
                                </label>
                                <div className="flex gap-2 sm:gap-3 justify-between" onPaste={handlePaste}>
                                    {digits.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-digit-${index}`}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            disabled={isLoading}
                                            className={`w-full aspect-square max-w-[52px] text-center text-xl font-bold border rounded-xl bg-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 ${digit ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border/60 text-foreground'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Verify Button */}
                            <button
                                id="otp-verify-btn"
                                type="submit"
                                disabled={!isComplete || isLoading}
                                className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-sm shadow-primary/20 hover:bg-primary-hover hover:shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Verifying…</span>
                                    </>
                                ) : (
                                    <span>Verify OTP</span>
                                )}
                            </button>
                        </form>

                        {/* Resend & Back */}
                        <div className="mt-6 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-sans">
                                <span>Didn't receive it?</span>
                                <button
                                    id="otp-resend-btn"
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0 || isResending}
                                    className="font-bold text-primary hover:text-accent transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isResending ? 'Resending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </div>
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
