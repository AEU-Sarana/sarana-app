'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../stores';
import { selectCurrentUser, updateUser } from '../../../features/auth/authSlice';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import { getInitials } from '../../../libs/utils';
import Alert from '../../../components/ui/alert';

export default function AdminProfilePage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password Form States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Global Alert Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Fetch full user details from auth API on mount
  const loadUserDetails = useCallback(async () => {
    try {
      setIsLoadingDetails(true);
      setErrorMsg(null);
      const res = await authService.getMe();
      const details = res.data;
      setProfileForm({
        fullName: details.fullName || '',
        username: details.username || '',
        email: details.email || '',
        phone: details.phone || '',
        bio: details.bio || '',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve detailed user profile.');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadUserDetails();
  }, [loadUserDetails]);

  // Real-time checks for profile form
  const validateProfile = () => {
    const errors: Record<string, string> = {};

    if (!profileForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (profileForm.fullName.length < 2 || profileForm.fullName.length > 100) {
      errors.fullName = 'Full name must be between 2 and 100 characters';
    }

    if (!profileForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (profileForm.username.length < 2 || profileForm.username.length > 100) {
      errors.username = 'Username must be between 2 and 100 characters';
    }

    if (profileForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email)) {
        errors.email = 'Invalid email format';
      }
    }

    if (profileForm.phone) {
      const phoneRegex = /^\+?[0-9\s-]{8,20}$/;
      if (!phoneRegex.test(profileForm.phone)) {
        errors.phone = 'Invalid phone format (8 to 20 digits/symbols)';
      }
    }

    if (profileForm.bio && profileForm.bio.length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Password Requirements Checklist
  const pwdLengthValid = passwordForm.newPassword.length >= 6;
  const pwdHasUpper = /[A-Z]/.test(passwordForm.newPassword);
  const pwdHasLower = /[a-z]/.test(passwordForm.newPassword);
  const pwdHasNumber = /\d/.test(passwordForm.newPassword);
  const pwdMatches = passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword !== '';

  const isPasswordValid = pwdLengthValid && pwdHasUpper && pwdHasLower && pwdHasNumber && pwdMatches && passwordForm.currentPassword !== '';

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    try {
      setIsProfileSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await authService.updateProfile({
        full_name: profileForm.fullName,
        username: profileForm.username,
        email: profileForm.email || undefined,
        phone: profileForm.phone || undefined,
        bio: profileForm.bio || undefined,
      });

      // Synchronize back to Redux state
      dispatch(
        updateUser({
          fullName: profileForm.fullName,
          email: profileForm.email,
        })
      );

      setSuccessMsg('Profile details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    try {
      setIsPasswordSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );

      setSuccessMsg('Password changed successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-sm font-bold text-foreground/50 tracking-wide">Loading user session...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Account Profile</h1>
        <p className="text-xs text-foreground/50 mt-1">
          Manage your personal account information, bio details, and update security passwords.
        </p>
      </div>

      {/* Global Alerts */}
      {errorMsg && <Alert type="error" message={errorMsg} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      {/* Premium Profile Banner Header Card */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm overflow-hidden select-none">
        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center font-black text-2xl text-primary shrink-0">
            {getInitials(profileForm.fullName || currentUser.fullName)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              {profileForm.fullName || currentUser.fullName || 'System Admin'}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-1.5">
              <span className="text-[11px] font-bold text-foreground/45">
                @{profileForm.username || 'admin'}
              </span>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span className="text-[10px] uppercase font-black tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {currentUser.role || 'ADMIN'}
              </span>
              <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active Account
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border/40 select-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'profile' ? (
          <div className="bg-card border border-border/40 rounded-3xl p-7 shadow-sm">
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-9 h-9 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                <span className="text-xs font-bold text-foreground/50">Fetching profile details...</span>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, fullName: e.target.value });
                        if (profileErrors.fullName) setProfileErrors({ ...profileErrors, fullName: '' });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 ${
                        profileErrors.fullName ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
                      }`}
                      placeholder="e.g. John Doe"
                    />
                    {profileErrors.fullName && (
                      <p className="text-[11px] text-destructive font-bold mt-1.5">{profileErrors.fullName}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, username: e.target.value });
                        if (profileErrors.username) setProfileErrors({ ...profileErrors, username: '' });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 ${
                        profileErrors.username ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
                      }`}
                      placeholder="e.g. johndoe"
                    />
                    {profileErrors.username && (
                      <p className="text-[11px] text-destructive font-bold mt-1.5">{profileErrors.username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, email: e.target.value });
                        if (profileErrors.email) setProfileErrors({ ...profileErrors, email: '' });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 ${
                        profileErrors.email ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
                      }`}
                      placeholder="e.g. john@example.com"
                    />
                    {profileErrors.email && (
                      <p className="text-[11px] text-destructive font-bold mt-1.5">{profileErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, phone: e.target.value });
                        if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: '' });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 ${
                        profileErrors.phone ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
                      }`}
                      placeholder="e.g. +855 12 345 678"
                    />
                    {profileErrors.phone && (
                      <p className="text-[11px] text-destructive font-bold mt-1.5">{profileErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                    Bio Description
                  </label>
                  <textarea
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, bio: e.target.value });
                      if (profileErrors.bio) setProfileErrors({ ...profileErrors, bio: '' });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border bg-secondary/15 dark:bg-secondary/5 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 resize-none ${
                      profileErrors.bio ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
                    }`}
                    placeholder="Tell us a little bit about yourself..."
                  />
                  <div className="flex justify-between mt-1.5">
                    {profileErrors.bio ? (
                      <p className="text-[11px] text-destructive font-bold">{profileErrors.bio}</p>
                    ) : (
                      <span className="text-[10px] text-foreground/35 font-semibold">
                        Maximum 500 characters
                      </span>
                    )}
                    <span className="text-[10px] text-foreground/35 font-semibold">
                      {profileForm.bio.length}/500
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2 select-none">
                  <button
                    type="submit"
                    disabled={isProfileSaving}
                    className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProfileSaving ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving Details...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Save Details
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-3xl p-7 shadow-sm">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Inputs Left Side */}
                <div className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full pl-4 pr-11 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3.5 top-3 text-foreground/40 hover:text-foreground cursor-pointer focus:outline-none"
                      >
                        {showCurrentPassword ? (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full pl-4 pr-11 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3.5 top-3 text-foreground/40 hover:text-foreground cursor-pointer focus:outline-none"
                      >
                        {showNewPassword ? (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/55 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full pl-4 pr-11 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3.5 top-3 text-foreground/40 hover:text-foreground cursor-pointer focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation Checklist Right Side */}
                <div className="bg-secondary/10 dark:bg-secondary/5 border border-border/30 rounded-2xl p-5 space-y-3.5 select-none h-fit self-end">
                  <h3 className="text-xs font-black text-foreground/80 uppercase tracking-wider">
                    Password Requirements
                  </h3>
                  
                  <ul className="space-y-2.5">
                    {/* Character length */}
                    <li className="flex items-center gap-2.5 text-[11px] font-bold">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${pwdLengthValid ? 'bg-success/15 text-success' : 'bg-foreground/10 text-foreground/35'}`}>
                        {pwdLengthValid ? '✓' : '•'}
                      </span>
                      <span className={pwdLengthValid ? 'text-success/90' : 'text-foreground/50'}>
                        At least 6 characters
                      </span>
                    </li>
                    {/* Lowercase check */}
                    <li className="flex items-center gap-2.5 text-[11px] font-bold">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${pwdHasLower ? 'bg-success/15 text-success' : 'bg-foreground/10 text-foreground/35'}`}>
                        {pwdHasLower ? '✓' : '•'}
                      </span>
                      <span className={pwdHasLower ? 'text-success/90' : 'text-foreground/50'}>
                        At least one lowercase letter
                      </span>
                    </li>
                    {/* Uppercase check */}
                    <li className="flex items-center gap-2.5 text-[11px] font-bold">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${pwdHasUpper ? 'bg-success/15 text-success' : 'bg-foreground/10 text-foreground/35'}`}>
                        {pwdHasUpper ? '✓' : '•'}
                      </span>
                      <span className={pwdHasUpper ? 'text-success/90' : 'text-foreground/50'}>
                        At least one uppercase letter
                      </span>
                    </li>
                    {/* Number check */}
                    <li className="flex items-center gap-2.5 text-[11px] font-bold">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${pwdHasNumber ? 'bg-success/15 text-success' : 'bg-foreground/10 text-foreground/35'}`}>
                        {pwdHasNumber ? '✓' : '•'}
                      </span>
                      <span className={pwdHasNumber ? 'text-success/90' : 'text-foreground/50'}>
                        At least one number
                      </span>
                    </li>
                    {/* Match confirmation */}
                    <li className="flex items-center gap-2.5 text-[11px] font-bold">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${pwdMatches ? 'bg-success/15 text-success' : 'bg-foreground/10 text-foreground/35'}`}>
                        {pwdMatches ? '✓' : '•'}
                      </span>
                      <span className={pwdMatches ? 'text-success/90' : 'text-foreground/50'}>
                        Passwords must match
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end pt-2 select-none">
                <button
                  type="submit"
                  disabled={!isPasswordValid || isPasswordSaving}
                  className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {isPasswordSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
                      </svg>
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
