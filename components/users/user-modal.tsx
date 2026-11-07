'use client';

import React, { useState, useEffect } from 'react';
import { User, CreateUserRequest, UpdateUserRequest } from '../../features/user/types';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { roleService, Role as RoleModel } from '../../services/roleService';
import { useLanguage } from '../../contexts/language-context';
import SearchableSelect from '../ui/searchable-select';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: User | null; // null means "Create Mode"
}

export function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const { t } = useLanguage();
  const isEditMode = !!user;

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('CASHIER');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [allowDashboard, setAllowDashboard] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleModel[]>([]);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with selected user and fetch dynamic roles list
  useEffect(() => {
    if (isOpen) {
      roleService
        .listRoles()
        .then((roles) => setAvailableRoles(roles))
        .catch(() => {});
    }

    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setPassword('');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || 'CASHIER');
      setStatus(user.status || 'active');

      if (user.allowDashboard !== undefined) {
        setAllowDashboard(user.allowDashboard);
      } else {
        authService
          .getUserPermissions(user.userId)
          .then((res) => {
            const perms = res?.data?.permissions || [];
            const hasDash = perms.some(
              (p: any) =>
                (typeof p === 'string' ? p === 'dashboard.view' : p?.featureKey === 'dashboard.view')
            );
            setAllowDashboard(hasDash);
          })
          .catch(() => {
            setAllowDashboard(user.role === 'ADMIN' || user.role === 'ADMINISTRATOR');
          });
      }
    } else {
      setFullName('');
      setUsername('');
      setPassword('');
      setEmail('');
      setPhone('');
      setRole('CASHIER');
      setStatus('active');
      setAllowDashboard(false);
    }
    setShowPassword(false);
    setError(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Common validations
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!isEditMode) {
      // Create validations
      if (!username.trim()) {
        setError('Username is required.');
        return;
      }
      if (username.length < 3 || username.length > 50) {
        setError('Username must be between 3 and 50 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers, and underscores.');
        return;
      }

      if (!password) {
        setError('Password is required.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
      }
    } else {
      // Edit mode password validation (optional)
      if (password && password.trim().length > 0) {
        if (password.length < 4) {
          setError('Password must be at least 4 characters.');
          return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && user) {
        const payload: UpdateUserRequest = {
          full_name: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          role: role,
          password: password.trim() ? password : undefined,
          status: status,
          allow_dashboard: allowDashboard,
        };
        await userService.updateUser(user.userId, payload);
      } else {
        const payload: CreateUserRequest = {
          full_name: fullName.trim(),
          username: username.trim(),
          password,
          role,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          allow_dashboard: allowDashboard,
        };
        await userService.createUser(payload);
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Card container */}
      <div className="relative w-full max-w-lg bg-card border border-border/40 rounded-3xl shadow-xl overflow-hidden animate-scale-up my-auto max-h-[90vh] flex flex-col pointer-events-auto">
        {/* Modal Header */}
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-6.5 sm:py-4.5 border-b border-border/20 bg-secondary/15 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight truncate">
              {isEditMode ? t('user_modal.edit_title', 'Edit User Details') : t('user_modal.register_title', 'Register New User')}
            </h3>
            <p className="text-[10px] text-foreground/45 mt-0.5 truncate">
              {isEditMode ? t('user_modal.edit_subtitle', 'Updating profiles for @{{username}}').replace('{{username}}', username) : t('user_modal.register_subtitle', 'Configure credentials and role clearances')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8.5 h-8.5 rounded-xl border border-border/50 hover:border-border text-foreground/50 hover:text-foreground hover:bg-secondary/40 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-start gap-3 mx-4 sm:mx-6.5 mt-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl shrink-0">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6.5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                {t('user_modal.full_name', 'Full Name')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('user_modal.full_name_placeholder', 'e.g. John Doe')}
                className="w-full px-3.5 py-2.5 sm:px-4 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25 min-h-[42px]"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                {t('user_modal.username', 'Username')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('user_modal.username_placeholder', 'e.g. john_doe')}
                className="w-full px-3.5 py-2.5 sm:px-4 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25 disabled:opacity-60 disabled:cursor-not-allowed min-h-[42px]"
                disabled={isSubmitting || isEditMode}
                required
              />
            </div>

            {/* Role Clearance */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                {t('user_modal.role_clearance', 'Role Clearance')} <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={role}
                onChange={(val) => {
                  const newRole = String(val);
                  setRole(newRole);
                  if (!isEditMode) {
                    if (newRole === 'ADMINISTRATOR' || newRole === 'ADMIN') {
                      setAllowDashboard(true);
                    } else {
                      setAllowDashboard(false);
                    }
                  }
                }}
                placeholder={t('user_modal.select_role', 'Select Role')}
                searchPlaceholder="Search role..."
                disabled={isSubmitting}
                options={
                  availableRoles.length > 0
                    ? availableRoles.map((r) => ({
                        value: r.key,
                        label: r.name,
                        sublabel: r.key,
                      }))
                    : [
                        { value: 'ADMINISTRATOR', label: 'Administrator (System)', sublabel: 'ADMINISTRATOR' },
                        { value: 'ADMIN', label: 'Admin (Store Manager)', sublabel: 'ADMIN' },
                        { value: 'CASHIER', label: 'Cashier', sublabel: 'CASHIER' },
                      ]
                }
              />
            </div>

            {/* Password (Required on Create, Optional on Edit) */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                {isEditMode ? 'New Password (Optional)' : t('user_modal.password', 'Password')}{' '}
                {!isEditMode && <span className="text-destructive">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isEditMode
                      ? 'Leave blank to keep current password'
                      : t('user_modal.password_placeholder', 'Minimum 4 characters, 1 uppercase, 1 lowercase, 1 digit')
                  }
                  className="w-full pl-3.5 pr-11 py-2.5 sm:pl-4 sm:pr-11 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25 min-h-[42px]"
                  disabled={isSubmitting}
                  required={!isEditMode}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
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
              <p className="text-[9px] text-foreground/40 font-medium mt-1">
                {isEditMode
                  ? 'Enter a new password only if you want to update this user\'s login password.'
                  : t('user_modal.password_complexity_note', 'Complexity: Required to contain A-Z, a-z, and 0-9.')}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                {t('user_modal.email_address', 'Email Address')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('user_modal.email_placeholder', 'e.g. john@example.com')}
                className="w-full px-3.5 py-2.5 sm:px-4 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25 min-h-[42px]"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                {t('user_modal.phone_number', 'Phone Number')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('user_modal.phone_placeholder', 'e.g. +123456789')}
                className="w-full px-3.5 py-2.5 sm:px-4 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25 min-h-[42px]"
                disabled={isSubmitting}
              />
            </div>

            {/* Status (Only in Edit Mode) */}
            {isEditMode && (
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                  {t('user_modal.account_status', 'Account Status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3.5 py-2.5 sm:px-4 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary outline-none transition-all cursor-pointer min-h-[42px]"
                  disabled={isSubmitting}
                >
                  <option value="active">{t('common.active', 'Active')}</option>
                  <option value="inactive">{t('common.inactive', 'Inactive')}</option>
                </select>
              </div>
            )}

            {/* Dashboard Access Permission Toggle */}
            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-secondary/15 dark:bg-secondary/10 border border-border/40 flex items-center justify-between gap-3 mt-1">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t('user_modal.dashboard_access', 'Dashboard Page Access')}
                  </span>
                  {role === 'ADMINISTRATOR' ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Always Granted
                    </span>
                  ) : allowDashboard ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Enabled
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-secondary text-foreground/40 border border-border/40">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-foreground/50 font-medium leading-relaxed">
                  {role === 'ADMINISTRATOR'
                    ? 'Administrator accounts inherently have unrestricted full access to all system dashboards.'
                    : t('user_modal.dashboard_access_desc', 'Allow this user to access and view the sales & business performance dashboard.')}
                </p>
              </div>

              <label className={`relative inline-flex items-center shrink-0 ${role === 'ADMINISTRATOR' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={role === 'ADMINISTRATOR' ? true : allowDashboard}
                  disabled={isSubmitting || role === 'ADMINISTRATOR'}
                  onChange={(e) => setAllowDashboard(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-border/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 border border-border text-xs font-bold text-foreground/60 hover:text-foreground rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer min-h-[42px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('user_modal.saving', 'Saving…')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditMode ? t('user_modal.save_changes', 'Save Changes') : t('user_modal.confirm_register', 'Confirm Register')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
