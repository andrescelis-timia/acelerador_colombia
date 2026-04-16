import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { createFetcher } from '@/lib/api/fetcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const useProjectRole = (projectId: string | null) => {
  const { user, country } = useAuth();
  const [projectRole, setProjectRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !user?.email) {
      setProjectRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        setLoading(true);
        const fetcher = createFetcher(user.email, country);
        const data = await fetcher(`${API_URL}/projects/${projectId}/my-role`);
        setProjectRole(data.role);
      } catch {
        setProjectRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [projectId, user?.email, country]);

  const isReadOnly = projectRole === 'OWNER_READONLY';

  return {
    projectRole,
    loading,
    isProjectOwner: projectRole === 'OWNER',
    isProjectDeveloper: projectRole === 'DEVELOPER',
    isReadOnly,
    isProjectMember: projectRole !== null,
    canEditProject: projectRole === 'OWNER',
    canCreateObjects: projectRole === 'OWNER' || projectRole === 'DEVELOPER',
    canGenerate: projectRole === 'OWNER' || projectRole === 'DEVELOPER',
    canEditObject: (creationUser: string) => {
      if (projectRole === 'OWNER') return true;
      if (projectRole === 'DEVELOPER' && user?.email === creationUser) return true;
      return false;
    },
  };
};
