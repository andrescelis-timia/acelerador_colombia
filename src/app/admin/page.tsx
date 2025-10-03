'use client';

import { useState } from 'react';
import { CreateUserWithPasswordForm } from '@/components/organisms/CreateUserWithPasswordForm';
import { AddPasswordToUserForm } from '@/components/organisms/AddPasswordToUserForm';
import { ResponseUserDto } from '@/services/User/types';
import { AdminRoute } from '@/components/organisms/AdminRoute';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'add'>('create');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSuccess = (user: ResponseUserDto) => {
    setErrorMessage('');
    if (activeTab === 'create') {
      setSuccessMessage(`Usuario ${user.email} creado exitosamente`);
    } else {
      setSuccessMessage(`Contraseña agregada exitosamente al usuario ${user.email}`);
    }
    
    // Clear message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleError = (error: string) => {
    setSuccessMessage('');
    setErrorMessage(error);
    
    // Clear message after 5 seconds
    setTimeout(() => setErrorMessage(''), 5000);
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Administración de Usuarios
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona usuarios y contraseñas del sistema
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

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('create')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'create'
                  ? 'border-[#0A3977] text-[#0A3977]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === 'create' ? 'page' : undefined}
            >
              Crear Usuario con Contraseña
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'add'
                  ? 'border-[#0A3977] text-[#0A3977]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === 'add' ? 'page' : undefined}
            >
              Agregar Contraseña a Usuario
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'create' && (
            <div>
              <div className="mb-4">
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
          )}

          {activeTab === 'add' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Agregar Contraseña a Usuario Existente
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Permite que un usuario existente (que usa Google OAuth) también pueda autenticarse con contraseña.
                </p>
              </div>
              <AddPasswordToUserForm
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Información Importante
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • Los usuarios creados con contraseña podrán autenticarse usando email/contraseña
            </p>
            <p>
              • Los usuarios existentes con Google OAuth pueden tener ambos métodos de autenticación
            </p>
            <p>
              • Las contraseñas deben cumplir con los requisitos de seguridad (8+ caracteres, mayúsculas, minúsculas, números y símbolos)
            </p>
            <p>
              • Esta funcionalidad estará completamente disponible cuando se complete la integración del backend
            </p>
          </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}