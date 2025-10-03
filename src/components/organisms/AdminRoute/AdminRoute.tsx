'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const AdminRoute = ({ children, fallbackPath = '/' }: AdminRouteProps) => {
  const { sessionData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && sessionData) {
      if (sessionData.role !== 'ADMIN') {
        // Usuario no es admin, redirigir
        router.push(fallbackPath);
        return;
      }
    }
  }, [sessionData, loading, router, fallbackPath]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3977] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Si no es admin, no mostrar nada (se redirigirá)
  if (!sessionData || sessionData.role !== 'ADMIN') {
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