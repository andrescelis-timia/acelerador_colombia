# Authentication State Management

This directory contains the enhanced authentication state management system that supports both Google OAuth and password-based authentication with unified session handling.

## Overview

The authentication system provides:
- **Unified Session Management**: Both Google OAuth and password authentication result in the same user session
- **JWT Token Management**: Secure token storage, validation, and automatic refresh
- **Session Persistence**: Maintains authentication state across browser refreshes and tabs
- **Cross-tab Synchronization**: Keeps authentication state synchronized across multiple tabs
- **Automatic Token Refresh**: Proactively refreshes tokens before expiration

## Architecture

```
AuthContext (Main State Management)
├── JWT Utilities (jwt.ts)
├── Token Refresh (tokenRefresh.ts)
├── Session Persistence (sessionPersistence.ts)
└── Unified API Client (../api/fetcher.ts)
    ├── createUnifiedFetcher() - Handles both auth methods
    ├── createRetryFetcher() - Auto-retry on auth failures
    ├── createSafeFetcher() - Standardized error handling
    └── Legacy createFetcher() - Backward compatibility
```

## Files

### `jwt.ts`
Core JWT token utilities:
- Token decoding and validation
- Expiration checking
- Token storage management
- User data extraction from tokens

### `tokenRefresh.ts`
Automatic token refresh functionality:
- Proactive token refresh before expiration
- Retry logic for failed API calls
- Token refresh API integration

### `sessionPersistence.ts`
Session state persistence across browser sessions:
- Session state saving/restoration
- Cross-tab synchronization
- Session validation and cleanup

### `AuthContext.tsx`
Main authentication context provider:
- Unified authentication state
- Google OAuth integration
- Password authentication
- Session management
- Token validation and refresh

### `../api/fetcher.ts`
Enhanced API client with unified authentication:
- **Unified Fetcher**: Automatically detects and handles both Google OAuth and JWT authentication
- **Token Refresh Integration**: Seamlessly refreshes JWT tokens on expiration
- **Backward Compatibility**: Existing services continue to work without changes
- **Retry Logic**: Automatic retry on authentication failures with token refresh
- **Error Handling**: Standardized error responses and status codes
- **Header Management**: Maintains existing X-User and X-Country headers for compatibility

## Usage

### Basic Authentication Check
```typescript
import { useAuth } from '@/lib/context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, authMethod } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return (
    <div>
      <p>Welcome {user?.email}</p>
      <p>Auth method: {authMethod}</p>
    </div>
  );
}
```

### Password Authentication
```typescript
import { useAuth } from '@/lib/context/AuthContext';

function LoginForm() {
  const { loginWithPassword } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
    const result = await loginWithPassword(email, password);
    if (result.success) {
      // User is now authenticated
    } else {
      console.error(result.error);
    }
  };
}
```

### API Calls with Authentication
```typescript
import { useUnifiedFetcher, useRetryFetcher, useSafeFetcher } from '@/lib/api/fetcher';

function DataComponent() {
  // Recommended: Unified fetcher handles both auth methods automatically
  const fetcher = useUnifiedFetcher();
  
  // Alternative: Retry fetcher with automatic retry on auth failures
  const retryFetcher = useRetryFetcher();
  
  // Alternative: Safe fetcher with standardized error handling
  const safeFetcher = useSafeFetcher();
  
  const fetchData = async () => {
    try {
      // Automatically includes valid JWT token and handles refresh
      const data = await fetcher('/api/data');
      return data;
    } catch (error) {
      console.error('API call failed:', error);
    }
  };
  
  const fetchDataWithRetry = async () => {
    try {
      // Automatically retries on 401 errors with token refresh
      const data = await retryFetcher('/api/data', {}, 2); // max 2 retries
      return data;
    } catch (error) {
      console.error('API call failed after retries:', error);
    }
  };
  
  const fetchDataSafely = async () => {
    // Returns standardized response format
    const response = await safeFetcher<MyDataType>('/api/data');
    if (response.success) {
      return response.data;
    } else {
      console.error('API error:', response.error, 'Status:', response.status);
    }
  };
}
```

### Manual Token Validation
```typescript
import { useAuth } from '@/lib/context/AuthContext';

function SecuritySensitiveComponent() {
  const { validateToken, refreshAuthToken } = useAuth();
  
  const handleSensitiveAction = async () => {
    const isValid = await validateToken();
    if (!isValid) {
      const refreshed = await refreshAuthToken();
      if (!refreshed) {
        // Redirect to login
        return;
      }
    }
    
    // Proceed with sensitive action
  };
}
```

## Authentication Flow

### Google OAuth Flow
1. User clicks "Sign in with Google"
2. Google OAuth popup/redirect
3. Firebase handles OAuth flow
4. AuthContext receives Firebase user
5. User data fetched from backend
6. Session established with `authMethod: 'google'`

### Password Authentication Flow
1. User enters email/password
2. Credentials sent to backend `/auth/login-password`
3. Backend validates and returns JWT token
4. Token stored securely in localStorage
5. User session initialized from JWT payload
6. Session established with `authMethod: 'password'`

### Session Restoration Flow
1. App loads/refreshes
2. Check for saved session state
3. If password auth, validate JWT token
4. If token expired, attempt refresh
5. If refresh fails, clear session
6. If Google auth, wait for Firebase state

## API Client Usage Patterns

### Unified Fetcher (Recommended)
The unified fetcher automatically handles both authentication methods:

```typescript
import { useUnifiedFetcher } from '@/lib/api/fetcher';

function MyService() {
  const fetcher = useUnifiedFetcher();
  
  // Works with both Google OAuth and password authentication
  const getData = async () => {
    return await fetcher('/api/data');
  };
}
```

### Legacy Fetcher (Backward Compatible)
Existing services using `createFetcher` continue to work unchanged:

```typescript
import { createFetcher } from '@/lib/api/fetcher';

// This still works and now supports both auth methods
const fetcher = createFetcher(user.email, country, token);
const data = await fetcher('/api/endpoint');
```

### Service Integration
Services automatically benefit from enhanced authentication:

```typescript
// In services/MyService/index.ts
import { createFetcher } from '@/lib/api/fetcher';

export async function getData(user: string, country: string) {
  const fetcher = createFetcher(user, country);
  // Now automatically handles JWT tokens and refresh
  return await fetcher(`${API_CONFIG.BASE_URL}/data`);
}
```

### Authentication Method Detection
The API client automatically detects the authentication method:

- **Google OAuth**: Uses X-User and X-Country headers (existing behavior)
- **Password Auth**: Uses JWT Bearer token with automatic refresh
- **Fallback**: Gracefully handles mixed scenarios

### Error Handling Patterns
```typescript
import { useRetryFetcher, useSafeFetcher } from '@/lib/api/fetcher';

// Pattern 1: Automatic retry on auth failures
const retryFetcher = useRetryFetcher();
try {
  const data = await retryFetcher('/api/data', {}, 2); // 2 retries
} catch (error) {
  // Handle final failure
}

// Pattern 2: Safe response format
const safeFetcher = useSafeFetcher();
const response = await safeFetcher<DataType>('/api/data');
if (response.success) {
  // Use response.data
} else {
  // Handle response.error and response.status
}
```

## Token Management

### Storage
- **Access Token**: Stored in localStorage as `jwt_token`
- **Refresh Token**: Stored in localStorage as `jwt_refresh_token`
- **Session State**: Stored in localStorage as `session_state`

### Validation
- Tokens are validated before each API call
- Expired tokens trigger automatic refresh
- Invalid tokens result in logout

### Refresh Strategy
- Proactive refresh when token expires within 5 minutes
- Automatic retry on 401 responses
- Fallback to logout if refresh fails

## Security Considerations

### Token Security
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Automatic cleanup on logout
- No token data in URL or logs

### Session Security
- Session state includes timestamp for staleness detection
- Cross-tab synchronization prevents inconsistent states
- Automatic cleanup of expired sessions

### API Security
- All API calls include proper authentication headers
- Automatic token refresh prevents expired token usage
- Graceful handling of authentication failures

## Error Handling

### Authentication Errors
- Invalid credentials: Clear error message to user
- Network errors: Retry logic with exponential backoff
- Token refresh failures: Automatic logout and redirect

### Session Errors
- Corrupted session state: Clear and restart authentication
- Cross-tab conflicts: Sync to most recent valid state
- Storage errors: Graceful fallback to memory-only state

## Testing

### Unit Tests
- JWT token validation and decoding
- Token expiration logic
- Storage utilities
- Session persistence

### Integration Tests
- Full authentication flows
- Token refresh scenarios
- Cross-tab synchronization
- API call authentication

## Migration Notes

### From Previous Implementation
- Existing Google OAuth users: No changes required
- Session cookies: Maintained for backward compatibility
- API headers: X-User and X-Country headers preserved
- User objects: Compatible User interface maintained

### Breaking Changes
- None - fully backward compatible
- New features are additive only
- Existing code continues to work unchanged

## Performance Considerations

### Token Validation
- Minimal overhead for token decoding
- Cached validation results where possible
- Efficient expiration checking

### Session Persistence
- Debounced session state saving
- Minimal localStorage operations
- Efficient cross-tab communication

### API Calls
- Single token refresh per session
- Parallel API calls share token state
- Minimal authentication overhead

## Future Enhancements

### Security Improvements
- HttpOnly cookie storage for tokens
- Token rotation on sensitive operations
- Enhanced session fingerprinting

### Performance Optimizations
- Token caching in memory
- Background token refresh
- Optimistic API calls

### Feature Additions
- Multi-factor authentication support
- Session timeout warnings
- Advanced session management