/**
 * Token Refresh Management
 * Handles automatic token refresh and retry logic
 */

import { tokenStorage, isTokenExpired, isTokenExpiringSoon } from './jwt';

export interface TokenRefreshResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Refresh JWT token using refresh token
 */
export const refreshToken = async (): Promise<TokenRefreshResponse> => {
  const refreshToken = tokenStorage.getRefresh();
  
  if (!refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Token refresh failed' };
    }

    if (data.success && data.token) {
      // Store new tokens
      tokenStorage.set(data.token);
      if (data.refreshToken) {
        tokenStorage.setRefresh(data.refreshToken);
      }
      
      return { 
        success: true, 
        token: data.token, 
        refreshToken: data.refreshToken 
      };
    }

    return { success: false, error: 'Invalid refresh response' };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
};

/**
 * Check if token needs refresh and refresh if necessary
 */
export const ensureValidToken = async (): Promise<string | null> => {
  const currentToken = tokenStorage.get();
  
  if (!currentToken) {
    return null;
  }

  // If token is expired, try to refresh
  if (isTokenExpired(currentToken)) {
    const refreshResult = await refreshToken();
    if (refreshResult.success && refreshResult.token) {
      return refreshResult.token;
    }
    // If refresh fails, clear tokens and return null
    tokenStorage.remove();
    return null;
  }

  // If token expires soon, try to refresh proactively
  if (isTokenExpiringSoon(currentToken, 300)) { // 5 minutes threshold
    const refreshResult = await refreshToken();
    if (refreshResult.success && refreshResult.token) {
      return refreshResult.token;
    }
    // If refresh fails but current token is still valid, return current token
    return currentToken;
  }

  return currentToken;
};

/**
 * Auto-refresh token interceptor for API calls
 */
export const withTokenRefresh = async <T>(
  apiCall: (token: string) => Promise<T>
): Promise<T> => {
  const token = await ensureValidToken();
  
  if (!token) {
    throw new Error('No valid token available');
  }

  try {
    return await apiCall(token);
  } catch (error: any) {
    // If we get a 401, try to refresh token once and retry
    if (error.status === 401) {
      const refreshResult = await refreshToken();
      if (refreshResult.success && refreshResult.token) {
        return await apiCall(refreshResult.token);
      }
      // If refresh fails, clear tokens and throw
      tokenStorage.remove();
      throw new Error('Authentication failed');
    }
    throw error;
  }
};