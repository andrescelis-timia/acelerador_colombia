'use client';

import { ProjectContent } from '@/components/organisms/ProjectContent';
import { useEffect, useState, useCallback } from 'react';
import { getAllData, deleteData } from '@/services/Project';
import { ProjectTableData } from '@/services/Project/types';
import { useAuth } from '@/lib/context/AuthContext';

export default function ProjectPage() {
  const { user, country } = useAuth();
  const [projects, setProjects] = useState<ProjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadProjects = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getAllData('table', user.email, country);
      setProjects(data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }, [user?.email, country]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, user?.email, country]);

  return (
    <ProjectContent 
      data={projects}
      onSearch={() => {}}
      onEdit={loadProjects}
      onDelete={async (id: string) => {
        if (!user?.email) return;
        await deleteData(id, user.email, country);
        loadProjects();
      }}
      searchTerm=""
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      itemsPerPage={itemsPerPage}
      totalItems={projects.length}
    />
  );
} 