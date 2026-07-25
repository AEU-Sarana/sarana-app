'use client';

import { useAppDispatch, useAppSelector } from '../stores';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
  clearCredentials,
  setCredentials,
  updateUser,
} from '../features/auth/authSlice';
import { authService } from '../services/authService';
import { UserSession, tokenStorage } from '../services/tokenStorage';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectAccessToken);

  const login = async (email: string, pass: string): Promise<UserSession> => {
    const userSession = await authService.login(email, pass);
    const accessToken = tokenStorage.getAccessToken() || '';
    dispatch(setCredentials({ user: userSession, accessToken }));
    return userSession;
  };

  const logout = (): void => {
    authService.logout();
    dispatch(clearCredentials());
    router.push('/login');
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await authService.getMe();
      if (res?.success && res?.data) {
        dispatch(
          updateUser({
            fullName: res.data.fullName,
            email: res.data.email,
            permissions: res.data.permissions || [],
          })
        );
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const can = (featureKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(featureKey);
  };

  return {
    user,
    isAuthenticated,
    token,
    isAdmin: user?.role === 'ADMIN',
    isCashier: user?.role === 'CASHIER',
    can,
    login,
    logout,
    refreshUser,
  };
}
