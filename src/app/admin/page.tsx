'use client';

import { useState, useEffect } from 'react';
import { CreateUserWithPasswordForm } from '@/components/organisms/CreateUserWithPasswordForm';
import { ResponseUserDto } from '@/services/User/types';
import { useUserRole } from '@/hooks/useUserRole';
import { ReadOnlyWrapper } from '@/components/organisms/ReadOnlyWrapper';
import { useAuth } from '@/lib/context/AuthContext';

interface UserListItem {
  id_user: string;
  email: string;
  country: string;
  role: string;
  has_google_auth: boolean;
  has_password_auth: boolean;
}

export default function AdminPage() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'create'>('users');
  const { isAdmin, isAdminReadonly, loading } = useUserRole();
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      if (!user?.email) {
        setErrorMessage('No se encontró usuario autenticado');
        return;
      }

      const userCountry = localStorage.getItem('selectedCountry') || 'CO';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/users`, {
        headers: {
          'X-User': user.email,
          'X-Country': userCountry,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setErrorMessage(data.error || 'Error al cargar usuarios');
        }
      } else {
        setErrorMessage('Error al cargar la lista de usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Error de conexión al cargar usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!loading && (isAdmin || isAdminReadonly)) {
      fetchUsers();
    }
  }, [loading, isAdmin, isAdminReadonly, user]);

  const handleSuccess = (user: ResponseUserDto) => {
    setErrorMessage('');
    setSuccessMessage(`Usuario ${user.email} creado exitosamente`);

    // Refresh user list
    fetchUsers();

    // Clear message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleError = (error: string) => {
    setSuccessMessage('');
    setErrorMessage(error);

    // Clear message after 5 seconds
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'ADMIN-READONLY': 'bg-yellow-100 text-yellow-800',
      'USER': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const getAuthMethodBadge = (hasGoogle: boolean, hasPassword: boolean) => {
    if (hasPassword) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
          User/password
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          Google
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Administración de Usuarios
          </h1>
          <p className="mt-2 text-gray-600">
            {isAdminReadonly
              ? 'Vista de solo lectura - Consulta usuarios del sistema'
              : 'Gestiona usuarios y crea nuevos usuarios'
            }
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

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                  ? 'border-[#0A3977] text-[#0A3977]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Lista de Usuarios
              </button>
              <ReadOnlyWrapper showFallback={false}>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'create'
                    ? 'border-[#0A3977] text-[#0A3977]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Crear Usuario
                </button>
              </ReadOnlyWrapper>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Usuarios del Sistema
              </h3>

              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3977] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando usuarios...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Método de Auth
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id_user} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.country}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getAuthMethodBadge(user.has_google_auth, user.has_password_auth)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <ReadOnlyWrapper fallbackMessage="Los usuarios de solo lectura no pueden crear usuarios.">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Crear Nuevo Usuario
                </h3>
                <p className="mt-1 text-sm text-gray-600 mb-6">
                  Crea un nuevo usuario que podrá autenticarse usando Google OAuth o email y contraseña.
                </p>
                <CreateUserWithPasswordForm
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </div>
            </div>
          </ReadOnlyWrapper>
        )}
      </div>
    </div>
  );
}