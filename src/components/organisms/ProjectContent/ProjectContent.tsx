'use client';

import { DataTable } from '@/components/molecules/DataTable';
import { ProjectContentProps } from './types';
import { PencilIcon, ArchiveBoxIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { ProjectUpdateWithId } from '@/services/Project/types';
import { getById, archiveData } from '@/services/Project';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { ObjectForm } from '@/components/organisms/ObjectForm';
import { ObjectCreate } from '@/services/Object/types';
import { Column } from '@/components/molecules/DataTable/types';
import { useAuth } from '@/lib/context/AuthContext';


const columns: Column[] = [
  { header: 'Código SDA', accessor: 'ticket_jira' },
  { header: 'Nombre del Proyecto', accessor: 'name' },
  {
    header: 'Fecha de Creación',
    accessor: 'creation_date',
    render: (value: unknown) => 
      new Date(value as string).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
  }
];

export const ProjectContent = ({ data, onSearch, onEdit, currentPage, setCurrentPage, itemsPerPage, totalItems, ...props }: ProjectContentProps) => {
  const { user, country } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState(data);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectUpdateWithId | undefined>(undefined);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<string | null>(null);
  const [isObjectFormOpen, setIsObjectFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setProjects(data);
  }, [data]);

  const handleEdit = async (id: string) => {
    if (!user?.email) return;
    const project = await getById(id, user.email, country);
    setSelectedProject(project || undefined);
    setIsEditFormOpen(true);
  };

  const handleCloseForm = (success?: boolean) => {
    setIsEditFormOpen(false);
    if (success) {
      setSuccessMessage(selectedProject ? 'Proyecto actualizado correctamente' : 'Proyecto creado correctamente');
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setSelectedProject(undefined);
    onEdit(selectedProject?.id_project || '');
  };

  const handleArchiveClick = (id: string) => {
    setProjectToArchive(id);
    setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (projectToArchive && user?.email) {
      try {
        await archiveData(projectToArchive, user.email, country);
        setIsArchiveModalOpen(false);
        setProjectToArchive(null);
        setSuccessMessage('Proyecto archivado correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        onEdit(projectToArchive); // Refrescar la lista después de archivar
      } catch (error) {
        console.error('Error al archivar:', error);
        setSuccessMessage('Error al archivar el proyecto');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleRowClick = (id: string) => {    
    router.push(`/object?projectId=${id}`);
  };

  const handleAddObject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsObjectFormOpen(true);
  };

  const handleCloseObjectForm = (success?: boolean) => {
    setIsObjectFormOpen(false);
    if (success) {
      setSuccessMessage('Objeto creado correctamente');
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setSelectedProjectId(null);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#00A3FF] text-xl font-semibold">Mis Proyectos</h2>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Ingrese el criterio de búsqueda"
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={props.searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsEditFormOpen(true)}
          className="bg-[#0A3977] text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">+</span>
          Crear Proyecto
        </button>
      </div>

      <DataTable
        data={Array.isArray(projects) ? projects.slice(startIndex, endIndex).map(proj => ({ ...proj, id: proj.id_project })) : []}
        columns={columns}
        onEdit={handleRowClick}
        onDelete={handleArchiveClick}
        renderActions={(item) => (
          <div key={`actions-${item.id}`} className="flex items-center justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddObject(item.id);
              }}
              className="bg-[#00A3FF] text-white px-2 py-1 rounded hover:bg-blue-600 mr-4 inline-flex items-center text-xs font-medium"
              title="Añadir Objeto"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Añadir Objeto
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item.id);
              }}
              className="text-indigo-600 hover:text-indigo-900 mr-4"
              title="Editar Proyecto"
            >
              <PencilIcon className="h-5 w-5 inline" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleArchiveClick(item.id);
              }}
              className="text-gray-600 hover:text-gray-900"
              title="Archivar Proyecto"
            >
              <ArchiveBoxIcon className="h-5 w-5 inline" />
            </button>
          </div>
        )}
      />

      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-3 py-1 bg-blue-100 rounded-md">
          Página {currentPage} de {Math.ceil(totalItems / itemsPerPage)}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      <ProjectForm
        isOpen={isEditFormOpen}
        onClose={handleCloseForm}
        projectId={selectedProject?.id_project}
        initialData={selectedProject}
      />

      <ObjectForm
        isOpen={isObjectFormOpen}
        onClose={handleCloseObjectForm}
        projectId={selectedProjectId || ''}
        initialData={{
          name: '',
          alias: '',
          url_document: ''
        } as ObjectCreate}
      />

      <Dialog
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <Dialog.Title className="text-lg font-medium">Confirmar archivo</Dialog.Title>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              ¿Estás seguro de que deseas archivar este proyecto? Esta acción moverá el proyecto al archivo histórico.
            </p>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                onClick={() => setIsArchiveModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                onClick={handleConfirmArchive}
              >
                Archivar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}; 