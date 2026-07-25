import { tokenStorage } from './tokenStorage';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  public onTokenRefresh?: () => Promise<boolean>;

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customOptions } = options;

    // 1. Build URL with query params
    let url = `${BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        searchParams.append(key, String(val));
      });
      url += `?${searchParams.toString()}`;
    }

    // 2. Setup Headers
    const requestHeaders = new Headers(headers);
    if (!requestHeaders.has('Content-Type') && !(customOptions.body instanceof FormData)) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    // 3. Attach Bearer token
    const token = tokenStorage.getAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...customOptions,
      headers: requestHeaders,
    };

    // 4. Perform request
    const response = await fetch(url, config);

    // 5. Handle HTTP Errors
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An unexpected error occurred' };
      }

      const isAuthError =
        response.status === 401 ||
        errorData?.code === 'AUTH_TOKEN_EXPIRED' ||
        errorData?.code === 'UNAUTHORIZED' ||
        errorData?.code === 'INVALID_TOKEN' ||
        errorData?.code === 'TOKEN_REUSE_DETECTED';

      // Handle automatic token refresh if 401 / auth error and we have a refresh handler registered
      if (isAuthError && this.onTokenRefresh) {
        const refreshed = await this.onTokenRefresh();
        if (refreshed) {
          // Retry the original request with new token
          const newToken = tokenStorage.getAccessToken();
          if (newToken) {
            requestHeaders.set('Authorization', `Bearer ${newToken}`);
          }
          const retryResponse = await fetch(url, config);
          if (retryResponse.ok) {
            return (await retryResponse.json()) as T;
          }
          try {
            errorData = await retryResponse.json();
          } catch {
            // Keep existing errorData
          }
        }
      }

      // If auth token expired and refresh failed / is impossible, force clear session & redirect to /login
      if (isAuthError) {
        tokenStorage.clear();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      throw new Error(errorData?.message || errorData?.error || 'HTTP request failed');
    }

    // 6. Return response body JSON
    return (await response.json()) as T;
  }

  get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export { BASE_URL };
