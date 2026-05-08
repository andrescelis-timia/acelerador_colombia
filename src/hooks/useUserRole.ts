import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export type UserRole = 'ADMIN' | 'APP_OWNER' | 'SERVICE_OWNER' | 'DATA_ENGINEER' | null;

const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

const normalizeRole = (raw: string | null | undefined): UserRole => {
  if (!raw) return null;
  // Legacy mappings: OWNER -> SERVICE_OWNER, DEVELOPER/USER -> DATA_ENGINEER, ADMIN-READONLY -> ADMIN
  switch (raw) {
    case 'ADMIN':
    case 'APP_OWNER':
    case 'SERVICE_OWNER':
    case 'DATA_ENGINEER':
      return raw;
    case 'OWNER':
      return 'SERVICE_OWNER';
    case 'DEVELOPER':
    case 'USER':
      return 'DATA_ENGINEER';
    case 'ADMIN-READONLY':
      return 'ADMIN';
    default:
      return 'DATA_ENGINEER';
  }
};

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
          setUserRole(normalizeRole(sessionData.role));
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
            const role = normalizeRole(data.role);
            roleCache.set(cacheKey, { role, timestamp: Date.now() });
            setUserRole(role);
          } else {
            roleCache.set(cacheKey, { role: 'DATA_ENGINEER', timestamp: Date.now() });
            setUserRole('DATA_ENGINEER');
          }
        } else if (!sessionData) {
          const storedRole = localStorage.getItem('auth_user_role');
          const role = normalizeRole(storedRole) || 'DATA_ENGINEER';
          roleCache.set(cacheKey, { role, timestamp: Date.now() });
          setUserRole(role);
        }
      } catch {
        setUserRole('DATA_ENGINEER');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchUserRole();
  }, [user?.email, sessionData, country, authMethod]);

  const isAppOwner = userRole === 'APP_OWNER';
  const isServiceOwner = userRole === 'SERVICE_OWNER';

  return {
    userRole,
    loading,
    isAdmin: userRole === 'ADMIN',
    isAppOwner,
    isServiceOwner,
    isOwner: isAppOwner || isServiceOwner,
    isDataEngineer: userRole === 'DATA_ENGINEER',
    canCreateProjects: userRole === 'ADMIN' || isAppOwner || isServiceOwner,
  };
};
