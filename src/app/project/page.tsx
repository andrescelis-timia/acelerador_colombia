'use client';

import { ProjectContent } from '@/components/organisms/ProjectContent';
import { useEffect, useState, useCallback } from 'react';
import { getAllData, deleteData } from '@/services/Project';
import { ProjectTableData } from '@/services/Project/types';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthStateDisplay } from '@/components/molecules/AuthStateDisplay';

function ProjectPageContent() {
  const { user, country } = useAuth();
  const [projects, setProjects] = useState<ProjectTableData[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;



  const loadProjects = useCallback(async () => {

    if (!user?.email) {
      return;
    }

    try {
      const data = await getAllData('table', user.email, country);
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar proyectos');
    }
  }, [user?.email, country]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Resetear a la primera página cuando se busca

    if (!term.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(term.toLowerCase()) ||
      project.ticket_jira.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) {
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
        data={filteredProjects}
        onSearch={handleSearch}
        onEdit={loadProjects}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredProjects.length}
      />
      <ErrorModal
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

export default function ProjectPage() {
  const { authState } = useAuthGuard();

  if (authState !== 'authenticated') {
    return <AuthStateDisplay state={authState as 'loading' | 'loggingOut' | 'unauthenticated'} />;
  }

  return <ProjectPageContent />;
} 