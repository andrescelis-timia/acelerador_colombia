'use client';

import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createData, updateData } from '@/services/Project';
import { ProjectFormProps } from './types';
import { ProjectUpdateWithId } from '@/services/Project/types';
import { ProjectCreate } from '@/services/Project/types';
import { useAuth } from '@/lib/context/AuthContext';

export const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose, projectId, initialData }) => {
  const { user } = useAuth();

  const fields: FormFieldConfig[] = projectId ? [
    {
      name: 'name',
      label: 'Nombre del Proyecto',
      placeholder: 'Ingrese el nombre del proyecto',
      type: 'input' as const
    },
    {
      name: 'status',
      label: 'Estado',
      placeholder: 'Seleccione el estado',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pendiente' },
        { value: 'in_progress', label: 'En Proceso' },
        { value: 'completed', label: 'Completado' }
      ]
    }
  ] : [
    {
      name: 'ticket_jira',
      label: 'Ticket Jira',
      placeholder: 'Ingrese el ticket de Jira',
      type: 'input' as const
    },
    {
      name: 'name',
      label: 'Nombre del Proyecto',
      placeholder: 'Ingrese el nombre del proyecto',
      type: 'input' as const
    }
  ];

  return (
    <SlideForm<ProjectUpdateWithId | ProjectCreate>
      isOpen={isOpen}
      onClose={onClose}
      title={projectId ? 'Editar Proyecto' : 'Crear Proyecto'}
      fields={fields}
      initialData={initialData || {
        name: '',
        ticket_jira: '',
        creation_user: ''
      } as ProjectCreate}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            creation_user: user?.email || ''
          };
          return createData(dataWithUser as ProjectCreate);
        },
        updateData: async (data) => {
          const dataWithUser = {
            ...data,
            update_user: user?.email || ''
          };
          return updateData(dataWithUser as ProjectUpdateWithId);
        }
      }}
      docId={projectId}
      mode={projectId ? 'edit' : 'create'}
    />
  );
}; 