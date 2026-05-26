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
      // Handle automatic token refresh if 401 and we have a refresh handler registered
      if (response.status === 401 && this.onTokenRefresh) {
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
        }
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An unexpected error occurred' };
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
