import { useAuth } from '@/lib/context/AuthContext';

export const useAuthGuard = () => {
  const { user, loading, loggingOut } = useAuth();

  const getAuthState = () => {
    if (loading) return 'loading';
    if (loggingOut) return 'loggingOut';
    if (!user?.email) return 'unauthenticated';
    return 'authenticated';
  };

  return {
    authState: getAuthState(),
    user,
    loading,
    loggingOut,
    isAuthenticated: !!user?.email && !loggingOut
  };
};