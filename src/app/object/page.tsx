'use client';

import { ObjectContent } from '@/components/organisms/ObjectContent/ObjectContent';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getAllData, deleteData } from '@/services/Object';
import { getObjectsById } from '@/services/Project';
import { ObjectTableData } from '@/services/Object/types';
import { useAuth } from '@/lib/context/AuthContext';

export default function ObjectPage() {
  const { user, country } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [objects, setObjects] = useState<ObjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadObjects = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = projectId 
        ? await getObjectsById(projectId, user.email, country)
        : await getAllData('table', user.email, country);
      setObjects(data);
    } catch (error) {
      console.error('Error al cargar objetos:', error);
    }
  }, [projectId, user?.email, country]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  return (
    <ObjectContent 
      data={objects}
      onSearch={() => {}}
      onEdit={loadObjects}
      onDelete={async (id: string) => {
        if (!user?.email) return;
        await deleteData(id, user.email, country);
        loadObjects();
      }}
      searchTerm=""
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      itemsPerPage={itemsPerPage}
      totalItems={objects.length}
    />
  );
} 