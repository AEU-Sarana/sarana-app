import { apiClient, BASE_URL } from './apiClient';
import { tokenStorage, UserSession } from './tokenStorage';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refresh_token: string;
    user: {
      userId: number;
      fullName: string;
      email: string;
      role: 'ADMIN' | 'CASHIER';
      isActive: boolean;
      permissions?: string[];
    };
  };
}

let activeRefreshPromise: Promise<boolean> | null = null;

export const authService = {
  async login(email: string, password: string): Promise<UserSession> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    if (response?.success && response?.data) {
      const { token, refresh_token, user } = response.data;
      
      // Save tokens
      tokenStorage.setAccessToken(token);
      tokenStorage.setRefreshToken(refresh_token);
      
      // Save user session
      const sessionUser: UserSession = {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      };
      tokenStorage.setUser(sessionUser);
      
      return sessionUser;
    }

    throw new Error(response?.message || 'Login failed');
  },

  handleSessionExpired(): void {
    tokenStorage.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  },

  async refreshAccessToken(): Promise<boolean> {
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        this.handleSessionExpired();
        return false;
      }

      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
          this.handleSessionExpired();
          return false;
        }

        const data = await res.json();
        if (data?.success && data?.data?.token) {
          tokenStorage.setAccessToken(data.data.token);
          if (data.data.refresh_token) {
            tokenStorage.setRefreshToken(data.data.refresh_token);
          }
          return true;
        }

        this.handleSessionExpired();
        return false;
      } catch {
        this.handleSessionExpired();
        return false;
      } finally {
        activeRefreshPromise = null;
      }
    })();

    return activeRefreshPromise;
  },

  logout(): void {
    tokenStorage.clear();
  },

  getCurrentUser(): UserSession | null {
    return tokenStorage.getUser();
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.getAccessToken();
  },

  async changePassword(current_password: string, new_password: string, confirm_password: string): Promise<any> {
    const response = await apiClient.post<any>('/auth/change-password', {
      current_password,
      new_password,
      confirm_password,
    });
    return response;
  },

  async updateProfile(payload: { full_name?: string; email?: string; username?: string; phone?: string; bio?: string }): Promise<any> {
    const response = await apiClient.put<any>('/auth/profile', payload);
    return response;
  },

  async getMe(): Promise<any> {
    const response = await apiClient.get<any>('/auth/me');
    return response;
  },

  async getSystemFeatures(): Promise<any> {
    return await apiClient.get<any>('/permissions/features');
  },

  async getUserPermissions(userId: number): Promise<any> {
    return await apiClient.get<any>(`/users/${userId}/permissions`);
  },

  async updateUserPermissions(userId: number, permissions: string[]): Promise<any> {
    return await apiClient.put<any>(`/users/${userId}/permissions`, { permissions });
  }
};

// Register the refresh handler dynamically to avoid circular dependencies
apiClient.onTokenRefresh = async () => {
  return await authService.refreshAccessToken();
};
