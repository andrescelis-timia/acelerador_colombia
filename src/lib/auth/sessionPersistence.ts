/**
 * Session Persistence Utilities
 * Handles session restoration across browser refreshes and tab changes
 */

import { tokenStorage } from './jwt';
import { ensureValidToken } from './tokenRefresh';

export interface SessionState {
  isAuthenticated: boolean;
  authMethod: 'google' | 'password' | null;
  user: {
    id: string;
    email: string;
    country: string;
    role: string;
  } | null;
  token: string | null;
}

/**
 * Save current session state to localStorage
 */
export const saveSessionState = (sessionState: SessionState): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionData = {
      ...sessionState,
      timestamp: Date.now()
    };
    localStorage.setItem('session_state', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session state:', error);
  }
};

/**
 * Restore session state from localStorage
 */
export const restoreSessionState = async (): Promise<SessionState | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedState = localStorage.getItem('session_state');
    if (!savedState) return null;
    
    const sessionData = JSON.parse(savedState);
    const now = Date.now();
    const sessionAge = now - (sessionData.timestamp || 0);
    
    // If session is older than 24 hours, consider it stale
    if (sessionAge > 24 * 60 * 60 * 1000) {
      clearSessionState();
      return null;
    }
    
    // For password authentication, validate the token
    if (sessionData.authMethod === 'password') {
      const validToken = await ensureValidToken();
      if (!validToken) {
        clearSessionState();
        return null;
      }
      
      // Update token in session state if it was refreshed
      sessionData.token = validToken;
    }
    
    return {
      isAuthenticated: sessionData.isAuthenticated,
      authMethod: sessionData.authMethod,
      user: sessionData.user,
      token: sessionData.token
    };
  } catch (error) {
    console.error('Failed to restore session state:', error);
    clearSessionState();
    return null;
  }
};

/**
 * Clear session state from localStorage
 */
export const clearSessionState = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('session_state');
  } catch (error) {
    console.error('Failed to clear session state:', error);
  }
};

/**
 * Check if there's a valid session that can be restored
 */
export const hasValidSession = async (): Promise<boolean> => {
  const sessionState = await restoreSessionState();
  return sessionState?.isAuthenticated === true;
};

/**
 * Get user data from current session
 */
export const getCurrentSessionUser = async (): Promise<SessionState['user'] | null> => {
  const sessionState = await restoreSessionState();
  return sessionState?.user || null;
};

/**
 * Session event listeners for cross-tab synchronization
 */
export const setupSessionSync = (onSessionChange: (sessionState: SessionState | null) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleStorageChange = async (event: StorageEvent) => {
    if (event.key === 'session_state') {
      const sessionState = await restoreSessionState();
      onSessionChange(sessionState);
    }
    
    // Handle token changes
    if (event.key === tokenStorage.get()) {
      const sessionState = await restoreSessionState();
      onSessionChange(sessionState);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

/**
 * Auto-save session state when it changes
 */
export const createSessionStateSaver = () => {
  let lastSavedState: string | null = null;
  
  return (sessionState: SessionState) => {
    const currentStateString = JSON.stringify(sessionState);
    
    // Only save if state has actually changed
    if (currentStateString !== lastSavedState) {
      saveSessionState(sessionState);
      lastSavedState = currentStateString;
    }
  };
};