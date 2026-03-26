import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export type UserRole = 'ADMIN' | 'OWNER' | 'DEVELOPER' | null;

// Cache global para evitar múltiples peticiones
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useUserRole = () => {
  const { user, sessionData, country, authMethod } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (fetchingRef.current) return;

      try {
        setLoading(true);
        fetchingRef.current = true;

        if (sessionData && sessionData.role) {
          // Map legacy roles
          let role = sessionData.role as string;
          if (role === 'USER') role = 'DEVELOPER';
          if (role === 'ADMIN-READONLY') role = 'ADMIN';
          setUserRole(role as UserRole);
          setLoading(false);
          return;
        }

        if (!user?.email) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const cacheKey = `${user.email}-${country}`;
        const cached = roleCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setUserRole(cached.role);
          setLoading(false);
          return;
        }

        if (authMethod === 'google') {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/role/${user.email}`, {
            headers: {
              'X-User': user.email,
              'X-Country': country || 'CO'
            }
          });

          if (response.ok) {
            const data = await response.json();
            let role = data.role as string;
            if (role === 'USER') role = 'DEVELOPER';
            if (role === 'ADMIN-READONLY') role = 'ADMIN';
            roleCache.set(cacheKey, { role: role as UserRole, timestamp: Date.now() });
            setUserRole(role as UserRole);
          } else {
            roleCache.set(cacheKey, { role: 'DEVELOPER', timestamp: Date.now() });
            setUserRole('DEVELOPER');
          }
        } else if (!sessionData) {
          const storedRole = localStorage.getItem('auth_user_role');
          if (storedRole) {
            let role = storedRole;
            if (role === 'USER') role = 'DEVELOPER';
            if (role === 'ADMIN-READONLY') role = 'ADMIN';
            roleCache.set(cacheKey, { role: role as UserRole, timestamp: Date.now() });
            setUserRole(role as UserRole);
          } else {
            roleCache.set(cacheKey, { role: 'DEVELOPER', timestamp: Date.now() });
            setUserRole('DEVELOPER');
          }
        }
      } catch {
        setUserRole('DEVELOPER');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchUserRole();
  }, [user?.email, sessionData, country, authMethod]);

  return {
    userRole,
    loading,
    isAdmin: userRole === 'ADMIN',
    isOwner: userRole === 'OWNER',
    isDeveloper: userRole === 'DEVELOPER',
    canCreateProjects: userRole === 'ADMIN' || userRole === 'OWNER',
  };
};
