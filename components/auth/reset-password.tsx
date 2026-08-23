'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../services/authService';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Very Weak', color: 'bg-destructive' };
    if (score === 2) return { score, label: 'Weak', color: 'bg-warning' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-400' };
    if (score === 4) return { score, label: 'Strong', color: 'bg-success' };
    return { score, label: 'Very Strong', color: 'bg-success' };
}

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const identifier = searchParams.get('identifier') ?? '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const canSubmit = newPassword.length >= 8 && passwordsMatch && !isLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await authService.resetPassword(identifier, newPassword, confirmPassword);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-md bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
                        Create New Password
                    </h1>
                    <p className="text-white/80 leading-relaxed font-sans text-sm font-medium">
                        Choose a strong password to secure your pharmacy account. Make sure it's at least 8 characters long.
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative z-10 shadow-xl shadow-black/5">
                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-white/90 mb-3.5">Password Tips</h3>
                    <ul className="space-y-3 text-sm font-sans text-white/85">
                        {[
                            'At least 8 characters long',
                            'Mix uppercase & lowercase letters',
                            'Include numbers & symbols',
                        ].map((tip, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white border border-white/15 shadow-sm">✓</span>
                                <span className="font-medium">{tip}</span>
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
                            <h2 className="text-2xl font-extrabold tracking-tight mb-2">Set New Password</h2>
                            <p className="text-muted-foreground text-sm font-sans">
                                Almost there! Create a strong new password for your account.
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
                        {success && (
                            <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm flex items-start gap-3">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Password reset successfully! Redirecting to sign in…</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* New Password */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-muted-foreground font-sans">
                                    New Password
                                </label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="reset-new-password"
                                        type={showNew ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                                        placeholder="Minimum 8 characters"
                                        disabled={isLoading || success}
                                        className="w-full pl-11 pr-11 py-3 bg-background border border-border/60 rounded-xl text-sm font-sans focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 group-hover:border-border disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                                    >
                                        {showNew ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Bar */}
                                {newPassword && (
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((seg) => (
                                                <div
                                                    key={seg}
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= seg ? strength.color : 'bg-border'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs font-semibold ${strength.score <= 1 ? 'text-destructive' : strength.score <= 2 ? 'text-warning' : 'text-success'}`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-muted-foreground font-sans">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="reset-confirm-password"
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                        placeholder="Re-enter your password"
                                        disabled={isLoading || success}
                                        className={`w-full pl-11 pr-11 py-3 bg-background border rounded-xl text-sm font-sans focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60 ${confirmPassword ? (passwordsMatch ? 'border-success focus:border-success focus:ring-success/20' : 'border-destructive/50 focus:border-destructive focus:ring-destructive/20') : 'border-border/60 focus:border-primary focus:ring-primary/20 group-hover:border-border'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                                    >
                                        {showConfirm ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {/* Match indicator */}
                                {confirmPassword && (
                                    <p className={`mt-1.5 text-xs font-semibold ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                                        {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                id="reset-submit-btn"
                                type="submit"
                                disabled={!canSubmit || success}
                                className="w-full mt-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-sm shadow-primary/20 hover:bg-primary-hover hover:shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Resetting…</span>
                                    </>
                                ) : success ? (
                                    <span>Password Reset ✓</span>
                                ) : (
                                    <span>Reset Password</span>
                                )}
                            </button>
                        </form>

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
