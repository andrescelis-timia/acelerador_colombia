'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';

interface AdminRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const AdminRoute = ({ children, fallbackPath = '/' }: AdminRouteProps) => {
  const { sessionData, loading } = useAuth();
  const [user] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const router = useRouter();

  // Obtener rol del usuario desde el backend
  const fetchUserRole = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/role/${email}`, {
        headers: {
          'X-User': email,
          'X-Country': 'CO'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  // Efecto para obtener el rol cuando el usuario cambia
  useEffect(() => {
    if (user?.email) {
      fetchUserRole(user.email);
    } else {
      setRoleLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!loading && !roleLoading) {
      const isAdmin = sessionData?.role === 'ADMIN' || userRole === 'ADMIN';
      
      if (!isAdmin) {
        // Usuario no es admin, redirigir
        router.push(fallbackPath);
        return;
      }
    }
  }, [sessionData, userRole, loading, roleLoading, router, fallbackPath]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3977] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Verificar si es admin (desde sessionData o desde userRole)
  const isAdmin = sessionData?.role === 'ADMIN' || userRole === 'ADMIN';

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <p className="text-sm text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};