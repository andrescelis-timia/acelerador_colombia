import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export type UserRole = 'ADMIN' | 'USER' | 'ADMIN-READONLY' | null;

export const useUserRole = () => {
  const { user, sessionData, country, authMethod } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoading(true);

        // Si hay sessionData (autenticación con password), usar el rol directamente
        if (sessionData && sessionData.role) {
          setUserRole(sessionData.role as UserRole);
          setLoading(false);
          return;
        }

        // Si es usuario Google OAuth, obtener rol desde backend
        if (user?.email && authMethod === 'google') {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/role/${user.email}`, {
            headers: {
              'X-User': user.email,
              'X-Country': country || 'CO'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role as UserRole);
          } else {
            setUserRole('USER'); // Default fallback
          }
        } else if (user?.email && !sessionData) {
          // Fallback: intentar obtener desde localStorage para autenticación basada en headers
          const storedRole = localStorage.getItem('auth_user_role');
          if (storedRole) {
            setUserRole(storedRole as UserRole);
          } else {
            setUserRole('USER');
          }
        }
      } catch (error) {
        console.error('Error obteniendo rol del usuario:', error);
        setUserRole('USER'); // Default fallback
      } finally {
        setLoading(false);
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