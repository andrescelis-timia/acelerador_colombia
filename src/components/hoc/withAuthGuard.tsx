import { ComponentType } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthStateDisplay } from '@/components/molecules/AuthStateDisplay';
import { useAuth } from '@/lib/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export function withAuthGuard<T extends object>(
  WrappedComponent: ComponentType<T>,
  options?: {
    requiredCountry?: string;
    countryErrorMessage?: string;
    requireAdmin?: boolean;
  }
) {
  return function AuthGuardedComponent(props: T) {
    const { authState } = useAuthGuard();
    const { country } = useAuth();
    const { isAdmin } = useUserRole();

    // Mostrar estados de carga/logout/no autenticado
    if (authState !== 'authenticated') {
      return <AuthStateDisplay state={authState as 'loading' | 'loggingOut' | 'unauthenticated'} />;
    }

    // Validar país si es requerido
    if (options?.requiredCountry) {
      if (country !== options.requiredCountry) {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-lg text-yellow-600">
                {options.countryErrorMessage || `Esta funcionalidad solo está disponible para ${options.requiredCountry}`}
              </div>
            </div>
          </div>
        );
      }
    }

    // Validar rol de admin si es requerido
    if (options?.requireAdmin) {
      if (!isAdmin) {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso Restringido</h2>
              <p className="text-gray-600">No tienes permisos para acceder a esta funcionalidad.</p>
            </div>
          </div>
        );
      }
    }

    return <WrappedComponent {...props} />;
  };
}