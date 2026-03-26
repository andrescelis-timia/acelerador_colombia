'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { getUserByEmail } from '@/services/User';
import { ResponseUserDto } from '@/services/User/types';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { 
  tokenStorage, 
  isTokenExpired, 
  getUserFromToken, 
  isValidJWTFormat,
  JWTPayload 
} from '@/lib/auth/jwt';
import { ensureValidToken, refreshToken } from '@/lib/auth/tokenRefresh';
import { 
  restoreSessionState, 
  clearSessionState,
  setupSessionSync,
  createSessionStateSaver,
  SessionState 
} from '@/lib/auth/sessionPersistence';

// Types for password authentication
export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface CreateUserWithPasswordRequest {
  email: string;
  password: string;
  country: 'CO' | 'PE';
  role: 'ADMIN' | 'OWNER' | 'DEVELOPER';
}

export interface CreateUserResult {
  success: boolean;
  user?: ResponseUserDto;
  error?: string;
}

// Removed AddPasswordToUserRequest/Result - no longer needed

export interface AuthMethods {
  hasGoogleAuth: boolean;
  hasPasswordAuth: boolean;
  userId: string;
}

export type AuthContextType = {
  user: User | null;
  country: string;
  countries: string[];
  setCountry: (country: string) => void;
  signInWithGoogle: () => Promise<void>;
  loading: boolean;
  loggingOut: boolean;
  // Password authentication methods
  loginWithPassword: (email: string, password: string) => Promise<LoginResult>;
  createUserWithPassword: (userData: CreateUserWithPasswordRequest) => Promise<CreateUserResult>;
  getUserAuthMethods: (email: string) => Promise<AuthMethods>;
  logout: () => Promise<void>;
  // JWT token management
  token: string | null;
  isAuthenticated: boolean;
  // Token refresh and validation
  refreshAuthToken: () => Promise<boolean>;
  validateToken: () => Promise<boolean>;
  // Unified session management
  authMethod: 'google' | 'password' | null;
  sessionData: JWTPayload | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  country: '',
  countries: [],
  setCountry: () => {},
  signInWithGoogle: async () => {},
  loading: true,
  loggingOut: false,
  // Password authentication methods
  loginWithPassword: async () => ({ success: false, error: 'Not implemented' }),
  createUserWithPassword: async () => ({ success: false, error: 'Not implemented' }),
  getUserAuthMethods: async () => ({ hasGoogleAuth: false, hasPasswordAuth: false, userId: '' }),
  logout: async () => {},
  // JWT token management
  token: null,
  isAuthenticated: false,
  // Token refresh and validation
  refreshAuthToken: async () => false,
  validateToken: async () => false,
  // Unified session management
  authMethod: null,
  sessionData: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Enhanced JWT token management
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'password' | null>(null);
  const [sessionData, setSessionData] = useState<JWTPayload | null>(null);
  
  // Session persistence
  const saveSession = createSessionStateSaver();

  // Token validation and refresh methods
  const validateToken = useCallback(async (): Promise<boolean> => {
    const currentToken = tokenStorage.get();
    
    if (!currentToken || !isValidJWTFormat(currentToken)) {
      return false;
    }

    if (isTokenExpired(currentToken)) {
      // Try to refresh the token
      const refreshResult = await refreshToken();
      if (refreshResult.success && refreshResult.token) {
        setToken(refreshResult.token);
        tokenStorage.set(refreshResult.token);
        return true;
      }
      return false;
    }

    return true;
  }, []);

  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    try {
      const validToken = await ensureValidToken();
      if (validToken) {
        setToken(validToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  // Initialize session from JWT token
  const initializeSessionFromToken = useCallback((jwtToken: string) => {
    const userData = getUserFromToken(jwtToken);
    if (userData) {
      setSessionData(userData);
      setAuthMethod('password');
      setIsAuthenticated(true);
      
      // Create a mock User object for compatibility
      const mockUser = {
        uid: userData.sub,
        email: userData.email,
        displayName: userData.email,
      } as User;
      
      setUser(mockUser);
      setCountries([userData.country]);
      setCountry(userData.country);
      
      // Set session cookie for middleware compatibility
      document.cookie = `session=${userData.sub}; path=/; secure; samesite=strict`;
      localStorage.setItem('selectedCountry', userData.country);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthMethod('google');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al iniciar sesión con Google');
      throw error;
    }
  };

  // Password authentication methods
  const loginWithPassword = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setLoading(true);
      // Get country from localStorage or default to CO
      const userCountry = localStorage.getItem('selectedCountry') || 'CO';

      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          country: userCountry 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }

      if (data.success && data.user) {
        // For header-based auth, we don't use JWT tokens
        // Instead, we store user info and set up the session
        const mockUser = {
          uid: data.user.id_user,
          email: data.user.email,
          displayName: data.user.email,
        } as User;
        

        
        setUser(mockUser);
        setCountries([data.user.country]);
        setCountry(data.user.country);
        setAuthMethod('password');
        setIsAuthenticated(true);
        
        // Store user info for header-based auth
        localStorage.setItem('auth_user_email', data.user.email);
        localStorage.setItem('auth_user_country', data.user.country);
        localStorage.setItem('auth_user_role', data.user.role);
        localStorage.setItem('selectedCountry', data.user.country);
        

        
        // Set session cookie for middleware compatibility
        document.cookie = `session=${data.user.id_user}; path=/; secure; samesite=strict`;
        
        return { success: true };
      }

      return { success: false, error: 'Respuesta inválida del servidor' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      setErrorMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const createUserWithPassword = async (userData: CreateUserWithPasswordRequest): Promise<CreateUserResult> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/users/create-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-User': user?.email || '',
          'X-Country': country,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al crear usuario' };
      }

      return { success: true, user: data.user };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      return { success: false, error: errorMsg };
    }
  };

  // Removed addPasswordToUser - no longer needed in current architecture

  const getUserAuthMethods = async (email: string): Promise<AuthMethods> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/${email}/auth-methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-User': user?.email || '',
          'X-Country': country,
        },
      });

      if (!response.ok) {
        return { hasGoogleAuth: false, hasPasswordAuth: false, userId: '' };
      }

      const data = await response.json();
      return data.authMethods || { hasGoogleAuth: false, hasPasswordAuth: false, userId: '' };
    } catch (error) {
      console.error('Error getting auth methods:', error);
      return { hasGoogleAuth: false, hasPasswordAuth: false, userId: '' };
    }
  };

  const logout = async () => {
    try {
      // Set logging out state to prevent error messages
      setLoggingOut(true);
      
      // Sign out from Firebase if using Google auth
      if (auth.currentUser && authMethod === 'google') {
        await auth.signOut();
      }
      
      // Clear all authentication state
      handleLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
      handleLogout();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Try to restore session state first
      const restoredSession = await restoreSessionState();
      
      if (restoredSession && restoredSession.isAuthenticated) {
        if (restoredSession.authMethod === 'password' && restoredSession.token) {
          // Restore password authentication session
          setToken(restoredSession.token);
          setAuthMethod('password');
          setIsAuthenticated(true);
          
          if (restoredSession.user) {
            const mockUser = {
              uid: restoredSession.user.id,
              email: restoredSession.user.email,
              displayName: restoredSession.user.email,
            } as User;
            setUser(mockUser);
            setCountry(restoredSession.user.country);
            setCountries([restoredSession.user.country]);
            
            // Get full session data from token
            const userData = getUserFromToken(restoredSession.token);
            if (userData) {
              setSessionData(userData);
            }
          }
        }
      } else {
        // No valid session, check for JWT token as fallback
        const savedToken = tokenStorage.get();
        if (savedToken && isValidJWTFormat(savedToken)) {
          if (!isTokenExpired(savedToken)) {
            // Token is valid, initialize session
            setToken(savedToken);
            initializeSessionFromToken(savedToken);
          } else {
            // Token is expired, try to refresh
            const isRefreshed = await refreshAuthToken();
            if (!isRefreshed) {
              // Refresh failed, clear tokens
              tokenStorage.remove();
              clearSessionState();
            }
          }
        } else {
          // No JWT tokens, check for header-based auth session
          const authUserEmail = localStorage.getItem('auth_user_email');
          const authUserCountry = localStorage.getItem('auth_user_country');
          const authUserRole = localStorage.getItem('auth_user_role');
          
          if (authUserEmail && authUserCountry && authUserRole) {
            
            // Restore password authentication session
            const mockUser = {
              uid: authUserEmail,
              email: authUserEmail,
              displayName: authUserEmail,
            } as User;
            
            // Crear sessionData para compatibilidad
            const mockSessionData = {
              sub: authUserEmail,
              email: authUserEmail,
              country: authUserCountry as 'CO' | 'PE',
              role: authUserRole as 'ADMIN' | 'OWNER' | 'DEVELOPER',
              iat: Date.now() / 1000, // issued at (now)
              exp: Date.now() / 1000 + 86400 // expires at (24 horas)
            };
            
            setUser(mockUser);
            setCountry(authUserCountry);
            setCountries([authUserCountry]);
            setAuthMethod('password');
            setIsAuthenticated(true);
            setSessionData(mockSessionData);
            

          }
        }
      }

      // Set up Firebase auth state listener for Google OAuth
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user?.email && !authMethod) { // Only handle Google auth if no other method is active
          try {
            const userData = await getUserByEmail(user.email);
            
            if (Array.isArray(userData) && userData.length > 0) {
              const userCountries = userData.map(user => user.country);
              
              setUser(user);
              setCountries(userCountries);
              setIsAuthenticated(true);
              setAuthMethod('google');
              document.cookie = `session=${user.uid}; path=/; secure; samesite=strict`;
              
              const savedCountry = localStorage.getItem('selectedCountry');
              
              if (savedCountry && userCountries.includes(savedCountry as 'CO' | 'PE')) {
                setCountry(savedCountry as 'CO' | 'PE');
              } else {
                setCountry(userCountries[0]);
                localStorage.setItem('selectedCountry', userCountries[0]);
              }
            } else {
              console.error('Usuario no tiene países asignados:', userData);
              setErrorMessage('Usuario no tiene países asignados');
              handleLogout();
            }
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Error al obtener datos del usuario');
            handleLogout();
          }
        } else if (!user && authMethod === 'google') {
          // Google user signed out
          handleLogout();
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe instanceof Promise) {
        unsubscribe.then(unsub => unsub());
      }
    };
  }, [authMethod, refreshAuthToken, initializeSessionFromToken]);

  const handleLogout = useCallback(() => {
    // Clear all authentication state (but keep loggingOut true for now)
    setUser(null);
    setCountries([]);
    setCountry('');
    setToken(null);
    setIsAuthenticated(false);
    setAuthMethod(null);
    setSessionData(null);
    
    // Clear all storage
    localStorage.removeItem('selectedCountry');
    localStorage.removeItem('auth_user_email');
    localStorage.removeItem('auth_user_country');
    localStorage.removeItem('auth_user_role');
    tokenStorage.remove();
    
    // Clear session cookie
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // Add a small delay to show "Cerrando sesión..." message, then redirect
    setTimeout(() => {
      setLoggingOut(false);
      router.push('/login');
    }, 1000); // 1 second delay
  }, [router]);

  // Save session state whenever authentication state changes
  useEffect(() => {
    const currentSessionState: SessionState = {
      isAuthenticated,
      authMethod,
      user: user ? {
        id: user.uid,
        email: user.email || '',
        country,
        role: sessionData?.role || 'USER'
      } : null,
      token
    };
    
    if (isAuthenticated) {
      saveSession(currentSessionState);
    } else {
      clearSessionState();
    }
  }, [isAuthenticated, authMethod, user, country, token, sessionData, saveSession]);

  // Save country selection
  useEffect(() => {
    if (country) {
      localStorage.setItem('selectedCountry', country);
    }
  }, [country]);

  // Setup cross-tab session synchronization
  useEffect(() => {
    const cleanup = setupSessionSync(async (sessionState) => {
      if (sessionState && sessionState.isAuthenticated) {
        // Another tab updated the session, sync our state
        if (sessionState.authMethod === 'password' && sessionState.token) {
          setToken(sessionState.token);
          setAuthMethod('password');
          setIsAuthenticated(true);
          if (sessionState.user) {
            const mockUser = {
              uid: sessionState.user.id,
              email: sessionState.user.email,
              displayName: sessionState.user.email,
            } as User;
            setUser(mockUser);
            setCountry(sessionState.user.country);
            setCountries([sessionState.user.country]);
          }
        }
      } else {
        // Session was cleared in another tab
        if (authMethod === 'password') {
          handleLogout();
        }
      }
    });
    
    return cleanup;
  }, [authMethod]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      country, 
      countries, 
      setCountry, 
      signInWithGoogle,
      loading,
      loggingOut,
      // Password authentication methods
      loginWithPassword,
      createUserWithPassword,
      getUserAuthMethods,
      logout,
      // JWT token management
      token,
      isAuthenticated,
      // Token refresh and validation
      refreshAuthToken,
      validateToken,
      // Unified session management
      authMethod,
      sessionData
    }}>
      {children}
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 