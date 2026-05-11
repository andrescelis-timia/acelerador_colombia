import { useAuth } from '@/lib/context/AuthContext';

export const useAuthGuard = () => {
  const { user, loading, loggingOut } = useAuth();

  // loggingOut no se traduce a authState: el LogoutOverlay cubre la pantalla.
  const getAuthState = () => {
    if (loading) return 'loading';
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