'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const AdminRoute = ({ children, fallbackPath = '/' }: AdminRouteProps) => {
  const { isAnyAdmin, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Permitir acceso si es ADMIN o ADMIN-READONLY
      if (!isAnyAdmin) {
        router.push(fallbackPath);
        return;
      }
    }
  }, [isAnyAdmin, loading, router, fallbackPath]);

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

  // Si no es ADMIN o ADMIN-READONLY, denegar acceso
  if (!isAnyAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Solo usuarios con permisos de administrador pueden acceder a esta sección.</p>
          <p className="text-sm text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};