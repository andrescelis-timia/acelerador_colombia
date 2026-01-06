import { DataTable } from '@/components/molecules/DataTable';
import { ObjectContentProps } from './types';
import { PencilIcon, ArchiveBoxIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { ObjectForm } from '@/components/organisms/ObjectForm';
import { ObjectUpdateWithId, PipelineStatus } from '@/services/Object/types';
import { getById, archiveData } from '@/services/Object';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Column } from '@/components/molecules/DataTable/types';
import { useAuth } from '@/lib/context/AuthContext';
import { ReadOnlyWrapper } from '@/components/organisms/ReadOnlyWrapper';
import { PipelineStatusIndicator } from '@/components/molecules/PipelineStatusIndicator';
import { PipelineStatusModal } from '@/components/molecules/PipelineStatusModal';

const getStatusLabel = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendiente',
    'in_progress': 'En Proceso',
    'completed': 'Completado'
  };
  return statusMap[status] || status;
};

// Estado por defecto cuando no hay pipeline_status
const DEFAULT_PIPELINE_STATUS: PipelineStatus = {
  gobierno: { status: 'pending' },
  kirby: { status: 'pending' },
  hammurabi: { status: 'pending' },
  smartcleaner: { status: 'pending' },
  controlm: { status: 'pending' }
};

export const ObjectContent = ({ data, onSearch, onEdit, currentPage, setCurrentPage, itemsPerPage, totalItems, ...props }: ObjectContentProps) => {
  const { user, country } = useAuth();
  const router = useRouter();
  const [objects, setObjects] = useState(data);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ObjectUpdateWithId | undefined>(undefined);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [objectToArchive, setObjectToArchive] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [selectedPipelineObject, setSelectedPipelineObject] = useState<{ name: string; status: PipelineStatus } | null>(null);

  const handlePipelineClick = (objectName: string, pipelineStatus: PipelineStatus | undefined) => {
    setSelectedPipelineObject({
      name: objectName,
      status: pipelineStatus || DEFAULT_PIPELINE_STATUS
    });
    setIsPipelineModalOpen(true);
  };

  const columns: Column[] = [
    { header: 'Nombre del Objeto', accessor: 'name' },
    { header: 'Proyecto', accessor: 'project_name' },
    {
      header: 'Estado',
      accessor: 'status',
      render: (value) => getStatusLabel(value as string)
    },
    {
      header: 'Pipeline E2E',
      accessor: 'pipeline_status',
      render: (value, row) => {
        const pipelineStatus = value as PipelineStatus | undefined;
        return (
          <PipelineStatusIndicator
            status={pipelineStatus || DEFAULT_PIPELINE_STATUS}
            onClick={() => handlePipelineClick(row?.name as string, pipelineStatus)}
          />
        );
      }
    },
    {
      header: 'Pre-diccionario',
      accessor: 'url_document',
      render: (value) => (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          Ver Documento
        </a>
      )
    }
  ];

  useEffect(() => {
    setObjects(data);
  }, [data]);

  const handleEdit = async (id: string) => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    
    const object = await getById(id, user.email, country);
    setSelectedObject(object || undefined);
    setIsEditFormOpen(true);
  };

  const handleCloseForm = (success?: boolean) => {
    setIsEditFormOpen(false);
    
    if (success) {
      setSuccessMessage('Objeto actualizado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      onEdit(selectedObject?.id_object || '');
    }
    
    setSelectedObject(undefined);
  };

  const handleArchiveClick = (id: string) => {
    setObjectToArchive(id);
    setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (!objectToArchive || !user?.email) return;
    
    try {
      await archiveData(objectToArchive, user.email, country);
      setIsArchiveModalOpen(false);
      setObjectToArchive(null);
      setSuccessMessage('Objeto archivado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      onEdit(objectToArchive);
    } catch (error) {
      console.error('Error al archivar:', error);
      setSuccessMessage('Error al archivar el objeto');
      setTimeout(() => setSuccessMessage(null), 3000);
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
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {errorMessage}
          <button 
            onClick={() => setErrorMessage(null)}
            className="ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

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
        onDelete={handleArchiveClick}
        renderActions={(item) => (
          <div key={`actions-${item.id}`}>
            <ReadOnlyWrapper showFallback={false}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(item.id);
                }}
                className="text-indigo-600 hover:text-indigo-900 mr-4"
                title="Editar Objeto"
              >
                <PencilIcon className="h-5 w-5 inline" />
              </button>
            </ReadOnlyWrapper>
            <ReadOnlyWrapper showFallback={false}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveClick(item.id);
                }}
                className="text-gray-600 hover:text-gray-900"
                title="Archivar Objeto"
              >
                <ArchiveBoxIcon className="h-5 w-5 inline" />
              </button>
            </ReadOnlyWrapper>
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
              ¿Estás seguro de que deseas archivar este objeto? Esta acción moverá el objeto al archivo histórico.
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

      {selectedPipelineObject && (
        <PipelineStatusModal
          isOpen={isPipelineModalOpen}
          onClose={() => {
            setIsPipelineModalOpen(false);
            setSelectedPipelineObject(null);
          }}
          objectName={selectedPipelineObject.name}
          status={selectedPipelineObject.status}
        />
      )}
    </>
  );
}; 