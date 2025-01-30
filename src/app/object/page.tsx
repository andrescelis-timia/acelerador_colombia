'use client';

import { ObjectContent } from '@/components/organisms/ObjectContent/ObjectContent';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { getAllData, deleteData } from '@/services/Object';
import { getObjectsById } from '@/services/Project';
import { ObjectTableData } from '@/services/Object/types';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';

function ObjectPageContent() {
  const { user, country } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [objects, setObjects] = useState<ObjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const itemsPerPage = 5;

  const loadObjects = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = projectId 
        ? await getObjectsById(projectId, user.email, country)
        : await getAllData('table', user.email, country);
      setObjects(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar objetos');
    }
  }, [projectId, user?.email, country]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  const handleDelete = async (id: string) => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    try {
      await deleteData(id, user.email, country);
      await loadObjects();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al eliminar objeto');
    }
  };

  return (
    <>
      <ObjectContent 
        data={objects}
        onSearch={() => {}}
        onEdit={loadObjects}
        onDelete={handleDelete}
        searchTerm=""
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={objects.length}
      />
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

export default function ObjectPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ObjectPageContent />
    </Suspense>
  );
} 