'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/authService';
import { useAppDispatch } from '../../stores';
import { setCredentials } from '../../features/auth/authSlice';
import { tokenStorage } from '../../services/tokenStorage';

export default function Login() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const user = await authService.login(email, password);

            // Populate the Redux store with the new credentials
            const accessToken = tokenStorage.getAccessToken() ?? '';
            dispatch(setCredentials({ user, accessToken }));

            // Redirect based on role
            if (user.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/cashier');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">

            {/* LEFT COLUMN: Visual Branding & POS Identity (Hidden on mobile) */}
            <div className="hidden md:flex md:w-[40%] flex-col justify-between p-12 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent),transparent),radial-gradient(ellipse_at_bottom_left,var(--color-primary),transparent)] bg-primary text-primary-foreground relative overflow-hidden isolate">

                {/* Subtle grid pattern overlay - positioned behind text/logo via z-0 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

                {/* Glowing floating blobs with soft animations - positioned behind text/logo */}
                <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDuration: '8s' }}></div>
                <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDuration: '10s', animationDelay: '3s' }}></div>

                {/* Top: Logo & Title */}
                <div className="flex items-center gap-3 relative z-10 select-none">
                    <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shadow-lg shadow-black/15 border border-white/20 transition-transform duration-300 hover:scale-105">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 10.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9.5M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-xl font-extrabold tracking-wider uppercase bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent drop-shadow-sm">
                        Sarana Pharmacy
                    </span>
                </div>

                {/* Center: Welcome Heading */}
                <div className="my-auto relative z-10 max-w-sm">
                    <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-md bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
                        Smart POS for Modern Pharmacies
                    </h1>
                    <p className="text-white/80 leading-relaxed font-sans text-sm font-medium">
                        Streamline your checkout, track batch expiry dates, and manage inventory seamlessly with multi-role cashier workflows.
                    </p>
                </div>

                {/* Bottom: Glassmorphic spec details */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative z-10 shadow-xl shadow-black/5 hover:border-white/15 transition-all duration-300">
                    <h3 className="text-xs uppercase tracking-widest font-extrabold text-white/90 mb-3.5">
                        POS Enterprise Core
                    </h3>
                    <ul className="space-y-3 text-sm font-sans text-white/85">
                        <li className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white border border-white/15 shadow-sm">✓</span>
                            <span className="font-medium">FIFO Batch Inventory Control</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white border border-white/15 shadow-sm">✓</span>
                            <span className="font-medium">Secure Digital Receipts</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white border border-white/15 shadow-sm">✓</span>
                            <span className="font-medium">Telegram Bot Admin Alerts</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* RIGHT COLUMN: Form & Authorization Container */}
            <div className="w-full md:w-[60%] flex items-center justify-center p-6 sm:p-12 bg-background relative">

                {/* Soft background glow */}
                <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-md relative z-10">

                    {/* Main Login Card */}
                    <div className="bg-card border border-border/40 shadow-2xl rounded-2xl p-8 sm:p-10 transition-all duration-300 hover:shadow-primary/5 hover:border-border/80">

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
                            <p className="text-muted-foreground text-sm font-sans">
                                Sign in to access your pharmacy counter dashboard
                            </p>
                        </div>

                        {/* Error Alert Box */}
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-start gap-3 animate-shake">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Email Input Field */}
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
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@pharmacy.com"
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border/60 rounded-xl text-sm font-sans focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 group-hover:border-border"
                                    />
                                </div>
                            </div>

                            {/* Password Input Field */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground font-sans">
                                        Password
                                    </label>
                                </div>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-11 py-3 bg-background border border-border/60 rounded-xl text-sm font-sans focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 group-hover:border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
                                    >
                                        {showPassword ? (
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
                            </div>

                            {/* Remember Me & Forgot Password Row */}
                            <div className="flex justify-between items-center text-sm font-sans pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
                                    />
                                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Remember Me</span>
                                </label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs font-bold text-primary hover:text-accent hover:underline uppercase tracking-wider transition-colors duration-150"
                                >
                                    Forgot Password?
                                </a>
                            </div>

                            {/* Sign In Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <span>Sign In</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
