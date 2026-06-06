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
    };
  };
}

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
      };
      tokenStorage.setUser(sessionUser);
      
      return sessionUser;
    }

    throw new Error(response?.message || 'Login failed');
  },

  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      return false;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        tokenStorage.clear();
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

      tokenStorage.clear();
      return false;
    } catch {
      tokenStorage.clear();
      return false;
    }
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
  }
};

// Register the refresh handler dynamically to avoid circular dependencies
apiClient.onTokenRefresh = async () => {
  return await authService.refreshAccessToken();
};
