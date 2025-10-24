/**
 * JWT Utilities Tests
 */

import { 
  decodeJWT, 
  isTokenExpired, 
  isTokenExpiringSoon, 
  getUserFromToken, 
  isValidJWTFormat,
  tokenStorage 
} from '../jwt';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('JWT Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidJWTFormat', () => {
    it('should return true for valid JWT format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(isValidJWTFormat(validToken)).toBe(true);
    });

    it('should return false for invalid JWT format', () => {
      expect(isValidJWTFormat('invalid.token')).toBe(false);
      expect(isValidJWTFormat('invalid')).toBe(false);
      expect(isValidJWTFormat('')).toBe(false);
      expect(isValidJWTFormat(null as any)).toBe(false);
    });
  });

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const decoded = decodeJWT(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.payload.sub).toBe('1234567890');
      expect(decoded?.payload.iat).toBe(1516239022);
    });

    it('should return null for invalid token', () => {
      expect(decodeJWT('invalid')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // Create a token that expired in the past
      const expiredPayload = {
        sub: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return false for valid token', () => {
      // Create a token that expires in the future
      const validPayload = {
        sub: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      
      expect(isTokenExpired(validToken)).toBe(false);
    });
  });

  describe('tokenStorage', () => {
    it('should store and retrieve tokens', () => {
      const testToken = 'test.token.here';
      
      mockLocalStorage.getItem.mockReturnValue(testToken);
      expect(tokenStorage.get()).toBe(testToken);
      
      tokenStorage.set(testToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jwt_token', testToken);
    });

    it('should remove tokens', () => {
      tokenStorage.remove();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jwt_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jwt_refresh_token');
    });
  });
});