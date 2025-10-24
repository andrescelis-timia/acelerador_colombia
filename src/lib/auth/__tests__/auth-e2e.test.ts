/**
 * End-to-End Authentication Tests
 * Tests the complete authentication flows for both Google OAuth and password authentication
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/context/AuthContext'
import { tokenStorage } from '@/lib/auth/jwt'
import email from 'next-auth/providers/email'
import email from 'next-auth/providers/email'
import email from 'next-auth/providers/email'

// Mock global fetch
global.fetch = jest.fn()

// Mock Firebase
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate no user initially
    callback(null)
    return jest.fn() // unsubscribe function
  }),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}))

// Test component to access auth context
function TestAuthComponent() {
  const { 
    loginWithPassword, 
    createUserWithPassword, 
    addPasswordToUser,
    getUserAuthMethods,
    user, 
    isAuthenticated, 
    authMethod,
    token,
    logout
  } = useAuth()

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="auth-method">{authMethod || 'none'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="token-status">{token ? 'has-token' : 'no-token'}</div>
      
      <button 
        data-testid="login-password-btn"
        onClick={() => loginWithPassword('test@example.com', 'password123')}
      >
        Login with Password
      </button>
      
      <button 
        data-testid="create-user-btn"
        onClick={() => createUserWithPassword({
          email: 'newuser@example.com',
          password: 'password123',
          country: 'CO',
          role: 'USER'
        })}
      >
        Create User
      </button>
      
      <button 
        data-testid="add-password-btn"
        onClick={() => addPasswordToUser({
          userId: 'test-user-id',
          password: 'password123'
        })}
      >
        Add Password
      </button>
      
      <button 
        data-testid="get-auth-methods-btn"
        onClick={() => getUserAuthMethods('test@example.com')}
      >
        Get Auth Methods
      </button>
      
      <button 
        data-testid="logout-btn"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  )
}

describe('End-to-End Authentication Tests', () => {
  beforeEach(() => {
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
    
    // Clear token storage
    tokenStorage.remove()
    
    // Clear localStorage
    localStorage.clear()
    
    // Clear cookies
    document.cookie = ''
  })

  describe('Password Authentication Flow', () => {
    it('should successfully authenticate with valid credentials', async () => {
      // Mock successful login response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjb3VudHJ5IjoiQ08iLCJyb2xlIjoiVVNFUiIsImV4cCI6OTk5OTk5OTk5OX0.signature',
          user: {
            id_user: 'test-user-id',
            email: 'test@example.com',
            country: 'CO',
            role: 'USER'
          }
        })
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Initially not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('auth-method')).toHaveTextContent('none')

      // Click login button
      fireEvent.click(screen.getByTestId('login-password-btn'))

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      // Verify authentication state
      expect(screen.getByTestId('auth-method')).toHaveTextContent('password')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('token-status')).toHaveTextContent('has-token')

      // Verify API call was made correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/login-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        }
      )

      // Verify token was stored
      expect(tokenStorage.get()).toBeTruthy()
    })

    it('should handle authentication failure with invalid credentials', async () => {
      // Mock failed login response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid credentials'
        })
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Click login button
      fireEvent.click(screen.getByTestId('login-password-btn'))

      // Wait for response
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      // Should remain not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('auth-method')).toHaveTextContent('none')
      expect(screen.getByTestId('token-status')).toHaveTextContent('no-token')
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Click login button
      fireEvent.click(screen.getByTestId('login-password-btn'))

      // Wait for error handling
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      // Should remain not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })
  })

  describe('Admin User Creation Flow', () => {
    it('should successfully create user with password', async () => {
      // First mock login to get admin token
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            token: 'admin-token',
            user: { email: 'admin@example.com', role: 'ADMIN' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id_user: 'new-user-id',
              email: 'newuser@example.com',
              country: 'CO',
              role: 'USER'
            }
          })
        })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // First login as admin
      fireEvent.click(screen.getByTestId('login-password-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      // Then create user
      fireEvent.click(screen.getByTestId('create-user-btn'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/v1/admin/users/create-with-password',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer admin-token',
            }),
            body: JSON.stringify({
              email: 'newuser@example.com',
              password: 'password123',
              country: 'CO',
              role: 'USER'
            })
          })
        )
      })
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page reloads', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjb3VudHJ5IjoiQ08iLCJyb2xlIjoiVVNFUiIsImV4cCI6OTk5OTk5OTk5OX0.signature'
      
      // Pre-populate token storage
      tokenStorage.set(validToken)

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should automatically authenticate from stored token
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      expect(screen.getByTestId('auth-method')).toHaveTextContent('password')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    it('should clear session on logout', async () => {
      // First authenticate
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: 'test-token',
          user: { email: 'test@example.com' }
        })
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Login
      fireEvent.click(screen.getByTestId('login-password-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      })

      // Logout
      fireEvent.click(screen.getByTestId('logout-btn'))

      // Should be logged out
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      })

      expect(screen.getByTestId('auth-method')).toHaveTextContent('none')
      expect(screen.getByTestId('token-status')).toHaveTextContent('no-token')
      expect(tokenStorage.get()).toBeNull()
    })
  })

  describe('Dual Authentication Methods', () => {
    it('should handle users with both Google and password authentication', async () => {
      // Mock auth methods response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authMethods: {
            hasGoogleAuth: true,
            hasPasswordAuth: true,
            userId: 'test-user-id'
          }
        })
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      fireEvent.click(screen.getByTestId('get-auth-methods-btn'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/v1/users/test@example.com/auth-methods',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            })
          })
        )
      })
    })
  })

  describe('Token Validation and Refresh', () => {
    it('should handle expired tokens gracefully', async () => {
      // Create an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjb3VudHJ5IjoiQ08iLCJyb2xlIjoiVVNFUiIsImV4cCI6MTAwMDAwMDAwMH0.signature'
      
      tokenStorage.set(expiredToken)

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should not authenticate with expired token
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      })

      // Token should be cleared
      expect(tokenStorage.get()).toBeNull()
    })
  })
})