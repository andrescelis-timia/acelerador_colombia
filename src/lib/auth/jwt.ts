/**
 * JWT Token Management Utilities
 * Handles JWT token validation, decoding, and expiration checks
 */

export interface JWTPayload {
  sub: string; // user id
  email: string;
  country: 'CO' | 'PE';
  role: 'ADMIN' | 'USER' | 'ADMIN-READONLY';
  iat: number; // issued at
  exp: number; // expires at
  requiresPasswordChange?: boolean;
}

export interface DecodedJWT {
  header: any;
  payload: JWTPayload;
  signature: string;
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This is for reading token data, not for security validation
 */
export const decodeJWT = (token: string): DecodedJWT | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      header,
      payload,
      signature: parts[2]
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.payload.exp < currentTime;
};

/**
 * Check if JWT token expires within the next N seconds
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 300): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.payload.exp < (currentTime + thresholdSeconds);
};

/**
 * Get user data from JWT token
 */
export const getUserFromToken = (token: string): JWTPayload | null => {
  const decoded = decodeJWT(token);
  return decoded?.payload || null;
};

/**
 * Validate JWT token format and basic structure
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode each part
    atob(parts[0]); // header
    atob(parts[1]); // payload
    return true;
  } catch {
    return false;
  }
};

/**
 * Storage keys for JWT tokens
 */
export const JWT_STORAGE_KEY = 'jwt_token';
export const JWT_REFRESH_STORAGE_KEY = 'jwt_refresh_token';

/**
 * Token storage utilities
 */
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(JWT_STORAGE_KEY);
  },
  
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(JWT_STORAGE_KEY, token);
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
  },
  
  getRefresh: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(JWT_REFRESH_STORAGE_KEY);
  },
  
  setRefresh: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(JWT_REFRESH_STORAGE_KEY, token);
  }
};