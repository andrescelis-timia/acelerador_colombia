'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const AdminRoute = ({ children, fallbackPath = '/' }: AdminRouteProps) => {
  const { isAdmin, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.push(fallbackPath);
        return;
      }
    }
  }, [isAdmin, loading, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-timia-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Solo usuarios ADMIN pueden acceder a esta seccion.</p>
          <p className="text-sm text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
