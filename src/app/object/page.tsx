'use client';

import { ObjectContent } from '@/components/organisms/ObjectContent/ObjectContent';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getAllData, deleteData } from '@/services/Object';
import { getObjectsById } from '@/services/Project';
import { ObjectTableData } from '@/services/Object/types';

export default function ObjectPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [objects, setObjects] = useState<ObjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadObjects = useCallback(async () => {
    try {
      const data = projectId 
        ? await getObjectsById(projectId)
        : await getAllData('table');
      setObjects(data);
    } catch (error) {
      console.error('Error al cargar objetos:', error);
    }
  }, [projectId]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  return (
    <ObjectContent 
      data={objects}
      onSearch={() => {}}
      onEdit={loadObjects}
      onDelete={async (id: string) => {
        await deleteData(id);
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