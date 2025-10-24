import { useAuth } from '../context/AuthContext';
import { ensureValidToken, withTokenRefresh } from '../auth/tokenRefresh';
import { tokenStorage } from '../auth/jwt';

interface FetcherOptions extends RequestInit {
  params?: Record<string, string>;
  skipTokenRefresh?: boolean; // Option to skip automatic token refresh
}

/**
 * Legacy createFetcher - maintained for backward compatibility
 * Now internally uses the unified fetcher approach
 */
export const createFetcher = (user: string | null | undefined, country: string, token?: string | null) => {
  return async (url: string, options: FetcherOptions = {}) => {
    if (!user) throw new Error('Usuario no autenticado');

    // Determine auth method based on token presence and format
    let authMethod: 'google' | 'password' | null = null;
    let effectiveToken = token;

    // If no token provided, check token storage for JWT
    if (!effectiveToken) {
      const storedToken = tokenStorage.get();
      if (storedToken) {
        effectiveToken = storedToken;
        authMethod = 'password';
      } else {
        authMethod = 'google'; // Fallback to Google OAuth headers
      }
    } else {
      authMethod = 'password'; // Token provided, assume password auth
    }

    // Use unified fetcher for consistent behavior
    const unifiedFetcher = createUnifiedFetcher(user, country, authMethod, effectiveToken);
    return unifiedFetcher(url, options);
  };
};

export const useFetcher = () => {
  const { user, country, token, authMethod } = useAuth();
  // Use unified fetcher for better authentication handling
  return createUnifiedFetcher(user?.email, country, authMethod, token);
};

/**
 * Enhanced fetcher with automatic token refresh and unified authentication
 * Supports both Google OAuth (header-based) and JWT (token-based) authentication
 */
export const createEnhancedFetcher = (user: string | null | undefined, country: string, authMethod?: 'google' | 'password' | null) => {
  return async (url: string, options: FetcherOptions = {}) => {
    if (!user) throw new Error('Usuario no autenticado');

    // Use token refresh wrapper for JWT authentication
    if (authMethod === 'password' && !options.skipTokenRefresh) {
      return withTokenRefresh(async (validToken: string) => {
        const headers: Record<string, string> = {
          'X-User': user,
          'X-Country': country,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
          ...(options.headers as Record<string, string> || {}),
        };

        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          let errorMessage = 'Error desconocido';
          try {
            const errorJson = await response.json();
            errorMessage = errorJson.message || JSON.stringify(errorJson);
          } catch {
            errorMessage = await response.text();
          }
          const customError = new Error(errorMessage) as Error & { status: number };
          customError.status = response.status;
          throw customError;
        }

        if (options.method === 'DELETE' || response.headers.get('content-length') === '0') {
          return undefined;
        }

        return response.json();
      });
    }

    // For Google OAuth or when skipTokenRefresh is true, use standard approach
    const headers: Record<string, string> = {
      'X-User': user,
      'X-Country': country,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add JWT token if available and not using Google OAuth
    if (authMethod === 'password') {
      const currentToken = tokenStorage.get();
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Error desconocido';
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorMessage = await response.text();
      }
      const customError = new Error(errorMessage) as Error & { status: number };
      customError.status = response.status;
      throw customError;
    }

    if (options.method === 'DELETE' || response.headers.get('content-length') === '0') {
      return undefined;
    }

    return response.json();
  };
};

export const useEnhancedFetcher = () => {
  const { user, country, authMethod } = useAuth();
  return createEnhancedFetcher(user?.email, country, authMethod);
};

/**
 * Unified API client that automatically handles both authentication methods
 * This is the recommended fetcher for all API calls
 */
export const createUnifiedFetcher = (user: string | null | undefined, country: string, authMethod?: 'google' | 'password' | null, token?: string | null) => {
  return async (url: string, options: FetcherOptions = {}) => {
    if (!user) throw new Error('Usuario no autenticado');

    // For password authentication, use enhanced fetcher with token refresh
    if (authMethod === 'password') {
      const enhancedFetcher = createEnhancedFetcher(user, country, authMethod);
      return enhancedFetcher(url, options);
    }

    // For Google OAuth, use traditional header-based authentication
    const headers: Record<string, string> = {
      'X-User': user,
      'X-Country': country,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add JWT token as fallback if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Error desconocido';
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorMessage = await response.text();
      }
      const customError = new Error(errorMessage) as Error & { status: number };
      customError.status = response.status;
      throw customError;
    }

    if (options.method === 'DELETE' || response.headers.get('content-length') === '0') {
      return undefined;
    }

    return response.json();
  };
};

export const useUnifiedFetcher = () => {
  const { user, country, authMethod, token } = useAuth();
  return createUnifiedFetcher(user?.email, country, authMethod, token);
}; 
/**

 * API client with automatic retry on token expiration
 * Handles both Google OAuth and JWT authentication seamlessly
 */
export const createRetryFetcher = (user: string | null | undefined, country: string, authMethod?: 'google' | 'password' | null, token?: string | null) => {
  return async (url: string, options: FetcherOptions = {}, maxRetries: number = 1) => {
    if (!user) throw new Error('Usuario no autenticado');

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const unifiedFetcher = createUnifiedFetcher(user, country, authMethod, token);
        return await unifiedFetcher(url, options);
      } catch (error: any) {
        lastError = error;
        
        // Only retry on authentication errors for password auth
        if (authMethod === 'password' && error.status === 401 && attempt < maxRetries) {
          // Try to refresh token and retry
          try {
            const validToken = await ensureValidToken();
            if (validToken) {
              token = validToken; // Update token for next attempt
              continue;
            }
          } catch (refreshError) {
            // If refresh fails, don't retry
            break;
          }
        }
        
        // Don't retry for other errors or if not password auth
        break;
      }
    }
    
    throw lastError;
  };
};

export const useRetryFetcher = () => {
  const { user, country, authMethod, token } = useAuth();
  return createRetryFetcher(user?.email, country, authMethod, token);
};

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Wrapper for API calls that returns a standardized response format
 */
export const createSafeFetcher = (user: string | null | undefined, country: string, authMethod?: 'google' | 'password' | null, token?: string | null) => {
  return async <T>(url: string, options: FetcherOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const unifiedFetcher = createUnifiedFetcher(user, country, authMethod, token);
      const data = await unifiedFetcher(url, options);
      return {
        success: true,
        data: data as T
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido',
        status: error.status
      };
    }
  };
};

export const useSafeFetcher = () => {
  const { user, country, authMethod, token } = useAuth();
  return createSafeFetcher(user?.email, country, authMethod, token);
};

/**
 * Utility to check if current authentication method supports token refresh
 */
export const supportsTokenRefresh = (authMethod?: 'google' | 'password' | null): boolean => {
  return authMethod === 'password';
};

/**
 * Utility to get current authentication headers for debugging
 */
export const getAuthHeaders = (user: string | null | undefined, country: string, authMethod?: 'google' | 'password' | null, token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-User': user || '',
    'X-Country': country,
    'Content-Type': 'application/json',
  };

  if (authMethod === 'password' && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};