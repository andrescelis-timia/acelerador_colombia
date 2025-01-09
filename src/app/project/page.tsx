'use client';

import { ProjectContent } from '@/components/organisms/ProjectContent';
import { useEffect, useState } from 'react';
import { getAllData, deleteData } from '@/services/Project';
import { ProjectTableData } from '@/services/Project/types';

export default function ProjectPage() {
  const [projects, setProjects] = useState<ProjectTableData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadProjects = async () => {
    try {
      const data = await getAllData('table');
      setProjects(data);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <ProjectContent 
      data={projects}
      onSearch={() => {}}
      onEdit={loadProjects}
      onDelete={async (id: string) => {
        await deleteData(id);
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