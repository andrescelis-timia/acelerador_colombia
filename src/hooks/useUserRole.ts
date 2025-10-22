import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export type UserRole = 'ADMIN' | 'USER' | 'ADMIN-READONLY' | null;

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
      // Evitar múltiples peticiones simultáneas
      if (fetchingRef.current) return;

      try {
        setLoading(true);
        fetchingRef.current = true;

        // Si hay sessionData (autenticación con password), usar el rol directamente
        if (sessionData && sessionData.role) {
          setUserRole(sessionData.role as UserRole);
          setLoading(false);
          return;
        }

        // Si no hay usuario, no hacer nada
        if (!user?.email) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Verificar caché primero
        const cacheKey = `${user.email}-${country}`;
        const cached = roleCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setUserRole(cached.role);
          setLoading(false);
          return;
        }

        // Si es usuario Google OAuth, obtener rol desde backend
        if (authMethod === 'google') {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/role/${user.email}`, {
            headers: {
              'X-User': user.email,
              'X-Country': country || 'CO'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const role = data.role as UserRole;

            // Guardar en caché
            roleCache.set(cacheKey, { role, timestamp: Date.now() });
            setUserRole(role);
          } else {
            const fallbackRole = 'USER' as UserRole;
            roleCache.set(cacheKey, { role: fallbackRole, timestamp: Date.now() });
            setUserRole(fallbackRole);
          }
        } else if (!sessionData) {
          // Fallback: intentar obtener desde localStorage para autenticación basada en headers
          const storedRole = localStorage.getItem('auth_user_role');
          if (storedRole) {
            const role = storedRole as UserRole;
            roleCache.set(cacheKey, { role, timestamp: Date.now() });
            setUserRole(role);
          } else {
            const fallbackRole = 'USER' as UserRole;
            roleCache.set(cacheKey, { role: fallbackRole, timestamp: Date.now() });
            setUserRole(fallbackRole);
          }
        }
      } catch (error) {
        console.error('Error obteniendo rol del usuario:', error);
        setUserRole('USER'); // Default fallback
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
    isAdminReadonly: userRole === 'ADMIN-READONLY',
    isAnyAdmin: userRole === 'ADMIN' || userRole === 'ADMIN-READONLY',
    isUser: userRole === 'USER'
  };
};