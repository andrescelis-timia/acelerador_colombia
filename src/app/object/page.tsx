'use client';

import { ObjectContent } from '@/components/organisms/ObjectContent/ObjectContent';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { getAllData, deleteData } from '@/services/Object';
import { getObjectsById } from '@/services/Project';
import { ObjectTableData } from '@/services/Object/types';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthStateDisplay } from '@/components/molecules/AuthStateDisplay';

function ObjectPageContent() {
  const { user, country } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [objects, setObjects] = useState<ObjectTableData[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<ObjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;



  const loadObjects = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = projectId 
        ? await getObjectsById(projectId, user.email, country)
        : await getAllData('table', user.email, country);
      setObjects(data);
      setFilteredObjects(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar objetos');
    }
  }, [projectId, user?.email, country]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Resetear a la primera página cuando se busca
    
    if (!term.trim()) {
      setFilteredObjects(objects);
      return;
    }

    const filtered = objects.filter(object => 
      object.name.toLowerCase().includes(term.toLowerCase()) ||
      object.project_name?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredObjects(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) {
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
        data={filteredObjects}
        onSearch={handleSearch}
        onEdit={loadObjects}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredObjects.length}
        projectId={projectId}
      />
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

function ObjectPageWithAuth() {
  const { authState } = useAuthGuard();
  
  if (authState !== 'authenticated') {
    return <AuthStateDisplay state={authState as 'loading' | 'loggingOut' | 'unauthenticated'} />;
  }
  
  return <ObjectPageContent />;
}

export default function ObjectPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ObjectPageWithAuth />
    </Suspense>
  );
} 