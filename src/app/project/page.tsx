'use client';

import { ProjectContent } from '@/components/organisms/ProjectContent';
import { useEffect, useState, useCallback } from 'react';
import { getAllData, deleteData } from '@/services/Project';
import { ProjectTableData } from '@/services/Project/types';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';

export default function ProjectPage() {
  const { user, country } = useAuth();
  const [projects, setProjects] = useState<ProjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const itemsPerPage = 5;

  const loadProjects = useCallback(async () => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    try {
      const data = await getAllData('table', user.email, country);
      setProjects(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar proyectos');
    }
  }, [user?.email, country]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = async (id: string) => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    try {
      await deleteData(id, user.email, country);
      await loadProjects();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al eliminar proyecto');
    }
  };

  return (
    <>
      <ProjectContent 
        data={projects}
        onSearch={() => {}}
        onEdit={loadProjects}
        onDelete={handleDelete}
        searchTerm=""
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={projects.length}
      />
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
} 