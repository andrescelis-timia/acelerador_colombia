'use client';

import { DataTable } from '@/components/molecules/DataTable';
import { ProjectContentProps } from './types';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { ProjectUpdateWithId } from '@/services/Project/types';
import { getById } from '@/services/Project';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { ObjectForm } from '@/components/organisms/ObjectForm';
import { ObjectCreate } from '@/services/Object/types';
import { Column } from '@/components/molecules/DataTable/types';

const getStatusLabel = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendiente',
    'in_progress': 'En Proceso',
    'completed': 'Completado'
  };
  return statusMap[status] || status;
};

const columns: Column[] = [
  { header: 'Nombre del Proyecto', accessor: 'name' },
  { 
    header: 'Estado', 
    accessor: 'status',
    render: (value: unknown) => getStatusLabel(value as string)
  },
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

export const ProjectContent = ({ data, onSearch, onEdit, onDelete, currentPage, setCurrentPage, itemsPerPage, totalItems, ...props }: ProjectContentProps) => {
  const router = useRouter();
  const [projects, setProjects] = useState(data);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectUpdateWithId | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isObjectFormOpen, setIsObjectFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(data);
  }, [data]);

  const handleEdit = async (id: string) => {
    const project = await getById(id);
    setSelectedProject(project);
    setIsEditFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsEditFormOpen(false);
    setSelectedProject(undefined);
    onEdit(selectedProject?.id_project || '');
  };

  const handleDeleteClick = (id: string) => {
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      await onDelete(projectToDelete);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleRowClick = (id: string) => {    
    router.push(`/object?projectId=${id}`);
  };

  const handleAddObject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsObjectFormOpen(true);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <>
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
        onDelete={handleDeleteClick}
        renderActions={(item) => (
          <div key={`actions-${item.id}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item.id);
              }}
              className="text-indigo-600 hover:text-indigo-900 mr-4"
            >
              <PencilIcon className="h-5 w-5 inline" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddObject(item.id);
              }}
              className="text-gray-600 hover:text-gray-900 mr-4"
            >
              <PlusIcon className="h-5 w-5 inline" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(item.id);
              }}
              className="text-red-600 hover:text-red-900"
            >
              <TrashIcon className="h-5 w-5 inline" />
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
        onClose={() => setIsObjectFormOpen(false)}
        projectId={selectedProjectId || ''}
        initialData={{
          name: '',
          alias: '',
          url_document: ''
        } as ObjectCreate}
      />

      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <Dialog.Title className="text-lg font-medium">Confirmar eliminación</Dialog.Title>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              ¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.
            </p>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                onClick={handleConfirmDelete}
              >
                Eliminar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}; 