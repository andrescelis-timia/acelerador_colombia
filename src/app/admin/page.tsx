'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateUserWithPasswordForm } from '@/components/organisms/CreateUserWithPasswordForm';
import { ResponseUserDto } from '@/services/User/types';
import { useAuth } from '@/lib/context/AuthContext';

export default function AdminPage() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { sessionData, loading } = useAuth();
  const router = useRouter();

  // Verificar permisos de admin (solo usuarios Google OAuth)
  useEffect(() => {
    if (!loading) {
      // Si hay sessionData = usuario con contraseña = NO admin
      if (sessionData) {
        router.push('/');
        return;
      }
    }
  }, [sessionData, loading, router]);

  const handleSuccess = (user: ResponseUserDto) => {
    setErrorMessage('');
    setSuccessMessage(`Usuario ${user.email} creado exitosamente`);

    // Clear message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleError = (error: string) => {
    setSuccessMessage('');
    setErrorMessage(error);

    // Clear message after 5 seconds
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Mostrar loading mientras se verifica
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

  // Si hay sessionData (usuario con contraseña), denegar acceso
  if (sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Solo usuarios con autenticación Google OAuth pueden acceder al panel de administración.</p>
          <p className="text-sm text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Administración de Usuarios
          </h1>
          <p className="mt-2 text-gray-600">
            Crea usuarios con autenticación por contraseña
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Crear Nuevo Usuario con Contraseña
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Crea un nuevo usuario que podrá autenticarse usando email y contraseña.
              </p>
            </div>
            <CreateUserWithPasswordForm
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Información del Sistema
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>Administradores:</strong> Solo usuarios con Google OAuth pueden acceder a este panel
            </p>
            <p>
              • <strong>Usuarios con contraseña:</strong> Tendrán acceso a la funcionalidad regular del sistema
            </p>
            <p>
              • <strong>Roles disponibles:</strong> ADMIN (completo), USER (regular), ADMIN-READONLY (solo lectura)
            </p>
            <p>
              • <strong>Requisitos de contraseña:</strong> Mínimo 8 caracteres
            </p>
            <p>
              • <strong>Separación de métodos:</strong> Los métodos de autenticación están completamente separados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}