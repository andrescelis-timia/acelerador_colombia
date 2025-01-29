import { DataTable } from '@/components/molecules/DataTable';
import { ObjectContentProps } from './types';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { ObjectForm } from '@/components/organisms/ObjectForm';
import { ObjectUpdateWithId } from '@/services/Object/types';
import { getById } from '@/services/Object';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Column } from '@/components/molecules/DataTable/types';
import { useAuth } from '@/lib/context/AuthContext';

const getStatusLabel = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendiente',
    'in_progress': 'En Proceso',
    'completed': 'Completado'
  };
  return statusMap[status] || status;
};

const columns: Column[] = [
  { header: 'Nombre del Objeto', accessor: 'name' },
  { 
    header: 'Estado', 
    accessor: 'status',
    render: (value: unknown) => getStatusLabel(value as string)
  },
  { 
    header: 'Enlace Pre-diccionario',
    accessor: 'url_document',
    render: (value: unknown) => (
      <a 
        href={value as string} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
        onClick={(e) => e.stopPropagation()}
      >
        Ver solicitud
      </a>
    )
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

export const ObjectContent = ({ data, onSearch, onEdit, onDelete, currentPage, setCurrentPage, itemsPerPage, totalItems, ...props }: ObjectContentProps) => {
  const { user, country } = useAuth();
  const router = useRouter();
  const [objects, setObjects] = useState(data);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ObjectUpdateWithId | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [objectToDelete, setObjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    setObjects(data);
  }, [data]);

  const handleEdit = async (id: string) => {
    if (!user?.email) return;
    const object = await getById(id, user.email, country);
    setSelectedObject(object || undefined);
    setIsEditFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsEditFormOpen(false);
    setSelectedObject(undefined);
    onEdit(selectedObject?.id_object || '');
  };

  const handleDeleteClick = (id: string) => {
    setObjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (objectToDelete) {
      await onDelete(objectToDelete);
      setIsDeleteModalOpen(false);
      setObjectToDelete(null);
    }
  };

  const handleRowClick = (id: string) => {    
    const selectedObj = objects.find(obj => obj.id_object === id);
    if (selectedObj) {
      router.push(`/object-detail/${id}?name=${encodeURIComponent(selectedObj.name)}`);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#00A3FF] text-xl font-semibold">Mis Objetos</h2>
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
      </div>

      <DataTable
        data={Array.isArray(objects) ? objects.slice(startIndex, endIndex).map(obj => ({ ...obj, id: obj.id_object })) : []}
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

      <ObjectForm
        isOpen={isEditFormOpen}
        onClose={handleCloseForm}
        projectId={selectedObject?.id_project}
        initialData={selectedObject}
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
              ¿Estás seguro de que deseas eliminar este objeto? Esta acción no se puede deshacer.
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