'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CreateUserWithPasswordForm } from '@/components/organisms/CreateUserWithPasswordForm';
import { ResponseUserDto } from '@/services/User/types';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/lib/context/AuthContext';
import { ProjectMemberService } from '@/services/ProjectMember';
import type { ProjectMember } from '@/services/ProjectMember/types';
import type { ProjectResponse } from '@/services/Project/types';

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
  const [userSearch, setUserSearch] = useState('');
  const [sortField, setSortField] = useState<'email' | 'country' | 'role'>('email');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'assignments'>('users');
  const { isAdmin, loading } = useUserRole();
  const { user } = useAuth();

  // Assignments tab state
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<'OWNER' | 'OWNER_READONLY' | 'DEVELOPER'>('DEVELOPER');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [assignCountry, setAssignCountry] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('selectedCountry') || 'CO' : 'CO'
  );
  const [assignView, setAssignView] = useState<'project' | 'user'>('project');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<{ id_project: string; project_name: string; project_role: string; creation_date: string | null }[]>([]);
  const [loadingUserProjects, setLoadingUserProjects] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignProjectSearch, setAssignProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [assignProjectRole, setAssignProjectRole] = useState<'OWNER' | 'OWNER_READONLY' | 'DEVELOPER'>('DEVELOPER');

  const fetchUsers = useCallback(async () => {
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
  }, [user?.email]);

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchUsers();
    }
  }, [loading, isAdmin, user, fetchUsers]);

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const userCountry = typeof window !== 'undefined' ? localStorage.getItem('selectedCountry') || 'CO' : 'CO';

  const fetchProjects = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoadingProjects(true);
      setSelectedProjectId(null);
      setMembers([]);
      const response = await fetch(`${API_URL}/projects`, {
        headers: { 'X-User': user.email, 'X-Country': assignCountry }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch { /* ignore */ } finally {
      setLoadingProjects(false);
    }
  }, [user?.email, assignCountry, API_URL]);

  const fetchMembers = useCallback(async (projectId: string) => {
    if (!user?.email) return;
    try {
      setLoadingMembers(true);
      const service = new ProjectMemberService(user.email, assignCountry);
      const data = await service.getMembers(projectId);
      setMembers(data);
    } catch { setMembers([]); } finally {
      setLoadingMembers(false);
    }
  }, [user?.email, assignCountry]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    fetchMembers(projectId);
  };

  const handleSelectUser = async (userId: string) => {
    if (!user?.email) return;
    setSelectedUserId(userId);
    setLoadingUserProjects(true);
    try {
      const service = new ProjectMemberService(user.email, assignCountry);
      const projects = await service.getUserProjects(userId);
      setUserProjects(projects);
    } catch {
      setUserProjects([]);
    } finally {
      setLoadingUserProjects(false);
    }
  };

  const handleAssignProjectToUser = async () => {
    if (!user?.email || !selectedUserId || !assignProjectId) return;
    const selectedUser = users.find(u => u.id_user === selectedUserId);
    if (!selectedUser) return;
    try {
      const service = new ProjectMemberService(user.email, assignCountry);
      await service.addMember(assignProjectId, { user_email: selectedUser.email, project_role: assignProjectRole });
      setAssignProjectId('');
      setAssignProjectSearch('');
      setSuccessMessage(`Proyecto asignado como ${assignProjectRole}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      handleSelectUser(selectedUserId);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Error al asignar proyecto');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAddMember = async () => {
    if (!user?.email || !selectedProjectId || !addMemberEmail.trim()) return;
    try {
      const service = new ProjectMemberService(user.email, assignCountry);
      await service.addMember(selectedProjectId, { user_email: addMemberEmail.trim(), project_role: addMemberRole });
      setAddMemberEmail('');
      setSuccessMessage(`Miembro ${addMemberEmail} agregado como ${addMemberRole}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchMembers(selectedProjectId);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Error al agregar miembro');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!user?.email || !selectedProjectId) return;
    try {
      const service = new ProjectMemberService(user.email, assignCountry);
      await service.removeMember(selectedProjectId, userId);
      setSuccessMessage('Miembro eliminado');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchMembers(selectedProjectId);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Error al eliminar miembro');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'OWNER' | 'OWNER_READONLY' | 'DEVELOPER') => {
    if (!user?.email || !selectedProjectId) return;
    try {
      const service = new ProjectMemberService(user.email, assignCountry);
      await service.updateMemberRole(selectedProjectId, userId, { project_role: newRole });
      setSuccessMessage(`Rol actualizado a ${newRole}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchMembers(selectedProjectId);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Error al cambiar rol');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchProjects();
    }
  }, [activeTab, assignCountry, fetchProjects]);

  const getAuthMethodBadge = (hasGoogle: boolean, hasPassword: boolean) => {
    if (hasPassword) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700">
          Password
        </span>
      );
    } else {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
          Google
        </span>
      );
    }
  };

  // Validación de acceso: solo usuarios ADMIN completos pueden acceder
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            Solo los administradores completos pueden acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Necesitas permisos de administrador para ver esta pagina.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {errorMessage}
          <button onClick={() => setErrorMessage('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#00A3FF] text-xl font-semibold">Administracion</h2>
      </div>

        {/* Tabs */}
        <div className="mb-3">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                  ? 'border-[#0A3977] text-[#0A3977]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Usuarios
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignments'
                  ? 'border-[#0A3977] text-[#0A3977]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Asignaciones
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">{users.length} usuarios</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-2.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0A3977] w-56"
                  />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-1 bg-[#0A3977] text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3977] mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {([['email', 'Email'], ['country', 'País'], ['role', 'Rol']] as const).map(([field, label]) => (
                          <th
                            key={field}
                            onClick={() => { setSortDir(sortField === field && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(field); }}
                            className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                          >
                            {label} {sortField === field && (sortDir === 'asc' ? '↑' : '↓')}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                          Auth
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users
                        .filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                        .sort((a, b) => {
                          const valA = a[sortField].toLowerCase();
                          const valB = b[sortField].toLowerCase();
                          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                        })
                        .map((u) => (
                        <tr key={u.id_user} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                            {u.email}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                            {u.country}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {editingUserId === u.id_user ? (
                              <select
                                value={u.role}
                                onChange={async (e) => {
                                  const newRole = e.target.value;
                                  try {
                                    const response = await fetch(`${API_URL}/admin/users/${u.id_user}/role`, {
                                      method: 'PUT',
                                      headers: { 'X-User': user?.email || '', 'X-Country': userCountry, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ role: newRole }),
                                    });
                                    if (response.ok) {
                                      setSuccessMessage(`Rol de ${u.email} actualizado a ${newRole}`);
                                      setTimeout(() => setSuccessMessage(''), 3000);
                                      setEditingUserId(null);
                                      fetchUsers();
                                    } else {
                                      const data = await response.json();
                                      setErrorMessage(data.detail || 'Error al actualizar rol');
                                    }
                                  } catch { setErrorMessage('Error al actualizar rol'); }
                                }}
                                onBlur={() => setEditingUserId(null)}
                                autoFocus
                                className="text-xs border border-blue-400 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="DEVELOPER">DEVELOPER</option>
                                <option value="OWNER">OWNER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                u.role === 'ADMIN' ? 'bg-red-50 text-red-700' :
                                u.role === 'OWNER' ? 'bg-purple-50 text-purple-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {getAuthMethodBadge(u.has_google_auth, u.has_password_auth)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingUserId(editingUserId === u.id_user ? null : u.id_user)}
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Editar rol"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Eliminar usuario ${u.email}?`)) return;
                                try {
                                  const response = await fetch(`${API_URL}/admin/users/${u.id_user}`, {
                                    method: 'DELETE',
                                    headers: { 'X-User': user?.email || '', 'X-Country': userCountry },
                                  });
                                  if (response.ok) {
                                    setSuccessMessage(`Usuario ${u.email} eliminado`);
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                    fetchUsers();
                                  } else {
                                    const data = await response.json();
                                    setErrorMessage(data.detail || 'Error al eliminar');
                                  }
                                } catch { setErrorMessage('Error al eliminar usuario'); }
                              }}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500">Pais:</label>
              <select
                value={assignCountry}
                onChange={(e) => setAssignCountry(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0A3977]"
              >
                <option value="CO">Colombia</option>
                <option value="PE">Peru</option>
              </select>
              <div className="flex bg-gray-100 rounded-md p-0.5 ml-auto">
                <button
                  onClick={() => { setAssignView('project'); setSelectedUserId(null); }}
                  className={`px-3 py-1 text-xs font-medium rounded ${assignView === 'project' ? 'bg-white shadow text-[#0A3977]' : 'text-gray-500'}`}
                >
                  Por Proyecto
                </button>
                <button
                  onClick={() => { setAssignView('user'); setSelectedProjectId(null); }}
                  className={`px-3 py-1 text-xs font-medium rounded ${assignView === 'user' ? 'bg-white shadow text-[#0A3977]' : 'text-gray-500'}`}
                >
                  Por Usuario
                </button>
              </div>
            </div>

            {assignView === 'project' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-3 py-3">
                <span className="text-xs font-medium text-gray-700">Proyectos</span>
                {loadingProjects ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3977] mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {projects.map((proj) => (
                      <button
                        key={proj.id_project}
                        onClick={() => handleSelectProject(proj.id_project)}
                        className={`w-full text-left px-3 py-2 rounded text-xs ${
                          selectedProjectId === proj.id_project
                            ? 'bg-[#0A3977] text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="font-medium truncate">{proj.name}</div>
                        <div className={`text-xs ${selectedProjectId === proj.id_project ? 'text-blue-200' : 'text-gray-400'}`}>
                          {proj.ticket_jira}
                        </div>
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">No hay proyectos</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Members panel */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
              <div className="px-3 py-3">
                <span className="text-xs font-medium text-gray-700 mb-2 block">
                  Miembros {selectedProjectId ? `del proyecto` : ''}
                </span>

                {!selectedProjectId ? (
                  <p className="text-xs text-gray-500 text-center py-4">Selecciona un proyecto para ver sus miembros</p>
                ) : (
                  <>
                    {/* Add member form */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Buscar email..." autoComplete="off"
                          value={addMemberEmail}
                          onChange={(e) => {
                            setAddMemberEmail(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0A3977]"
                        />
                        {showUserDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {users
                              .filter(u => u.email.toLowerCase().includes(addMemberEmail.toLowerCase()))
                              .filter(u => !members.some(m => m.user_email === u.email))
                              .map(u => (
                                <button
                                  key={u.id_user}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setAddMemberEmail(u.email);
                                    setShowUserDropdown(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-100 flex justify-between items-center"
                                >
                                  <span>{u.email}</span>
                                  <span className="text-xs text-gray-400">{u.role}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <select
                        value={addMemberRole}
                        onChange={(e) => setAddMemberRole(e.target.value as 'OWNER' | 'OWNER_READONLY' | 'DEVELOPER')}
                        className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                      >
                        <option value="DEVELOPER">Developer</option>
                        <option value="OWNER">Owner</option>
                        <option value="OWNER_READONLY">Owner (Solo lectura)</option>
                      </select>
                      <button
                        onClick={handleAddMember}
                        disabled={!addMemberEmail.trim()}
                        className="px-3 py-1.5 bg-[#0A3977] text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                    </div>

                    {/* Members list */}
                    {loadingMembers ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3977] mx-auto"></div>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Rol</th>
                            <th className="px-3 py-1.5 text-right text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {members.map((member) => (
                            <tr key={member.id_project_member} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-xs text-gray-900">{member.user_email}</td>
                              <td className="px-3 py-2">
                                <select
                                  value={member.project_role}
                                  onChange={(e) => handleChangeRole(member.id_user, e.target.value as 'OWNER' | 'OWNER_READONLY' | 'DEVELOPER')}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="DEVELOPER">Developer</option>
                                  <option value="OWNER">Owner</option>
                                  <option value="OWNER_READONLY">Owner (Solo lectura)</option>
                                </select>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleRemoveMember(member.id_user)}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                          {members.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-500">
                                Sin miembros asignados
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
            )}

            {assignView === 'user' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-3 py-3">
                  <h3 className="text-xs font-medium text-gray-700">Usuarios</h3>
                  {loadingUsers ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3977] mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {users.map((u) => (
                        <button
                          key={u.id_user}
                          onClick={() => handleSelectUser(u.id_user)}
                          className={`w-full text-left px-3 py-2 rounded text-xs ${
                            selectedUserId === u.id_user
                              ? 'bg-[#0A3977] text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="font-medium truncate">{u.email}</div>
                          <div className={`text-xs ${selectedUserId === u.id_user ? 'text-blue-200' : 'text-gray-400'}`}>
                            {u.role} · {u.country}
                          </div>
                        </button>
                      ))}
                      {users.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No hay usuarios</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
                <div className="px-3 py-3">
                  <h3 className="text-xs font-medium text-gray-700 mb-2">
                    Proyectos asignados {selectedUserId ? `al usuario` : ''}
                  </h3>
                  {!selectedUserId ? (
                    <p className="text-xs text-gray-500 text-center py-4">Selecciona un usuario para ver sus proyectos</p>
                  ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Buscar proyecto..."
                          value={assignProjectSearch}
                          onChange={(e) => {
                            setAssignProjectSearch(e.target.value);
                            setAssignProjectId('');
                            setShowProjectDropdown(true);
                          }}
                          onFocus={() => setShowProjectDropdown(true)}
                          onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#0A3977]"
                        />
                        {showProjectDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                            {projects
                              .filter(p => !userProjects.some(up => up.id_project === p.id_project))
                              .filter(p => p.name.toLowerCase().includes(assignProjectSearch.toLowerCase()))
                              .map(p => (
                                <button
                                  key={p.id_project}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setAssignProjectId(p.id_project);
                                    setAssignProjectSearch(p.name);
                                    setShowProjectDropdown(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-100 flex justify-between items-center"
                                >
                                  <span>{p.name}</span>
                                  <span className="text-[10px] text-gray-400">{p.ticket_jira}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <select
                        value={assignProjectRole}
                        onChange={(e) => setAssignProjectRole(e.target.value as 'OWNER' | 'OWNER_READONLY' | 'DEVELOPER')}
                        className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                      >
                        <option value="DEVELOPER">Developer</option>
                        <option value="OWNER">Owner</option>
                        <option value="OWNER_READONLY">Owner (Solo lectura)</option>
                      </select>
                      <button
                        onClick={handleAssignProjectToUser}
                        disabled={!assignProjectId}
                        className="px-3 py-1.5 bg-[#0A3977] text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Asignar
                      </button>
                    </div>
                  {loadingUserProjects ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3977] mx-auto"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Proyecto</th>
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Rol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userProjects.map((p) => (
                          <tr key={p.id_project} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-900">{p.project_name || p.id_project}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                p.project_role === 'OWNER' ? 'bg-amber-100 text-amber-700' : p.project_role === 'OWNER_READONLY' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {p.project_role}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {userProjects.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-3 py-4 text-center text-xs text-gray-500">
                              Sin proyectos asignados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  </>
                  )}
                </div>
              </div>
            </div>
            )}

          </div>
        )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900">Crear Nuevo Usuario</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 [&_label]:text-xs [&_input]:text-xs [&_input]:py-1.5 [&_select]:text-xs [&_select]:py-1.5 [&_button[type=submit]]:text-xs [&_button[type=submit]]:py-1.5 [&_.space-y-6]:space-y-3 [&_.space-y-4]:space-y-3 [&_.space-y-6]:!space-y-3">
              <CreateUserWithPasswordForm
                onSuccess={(u) => { handleSuccess(u); setShowCreateModal(false); }}
                onError={handleError}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}