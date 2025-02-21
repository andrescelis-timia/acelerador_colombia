'use client';

import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createData, updateData } from '@/services/Project';
import { ProjectFormProps } from './types';
import { ProjectUpdateWithId } from '@/services/Project/types';
import { ProjectCreate } from '@/services/Project/types';
import { useAuth } from '@/lib/context/AuthContext';

export const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose, projectId, initialData }) => {
  const { user, country } = useAuth();

  const fields: FormFieldConfig[] = projectId ? [
    {
      name: 'name',
      label: 'Nombre del Proyecto',
      placeholder: 'Ingrese el nombre del proyecto',
      type: 'input' as const,
      required: true
    }
  ] : [
    {
      name: 'ticket_jira',
      label: 'Ticket Jira',
      placeholder: 'Ingrese el ticket de Jira',
      type: 'input' as const,
      required: true
    },
    {
      name: 'name',
      label: 'Nombre del Proyecto',
      placeholder: 'Ingrese el nombre del proyecto',
      type: 'input' as const,
      required: true
    }
  ];

  return (
    <SlideForm<ProjectUpdateWithId | ProjectCreate>
      isOpen={isOpen}
      onClose={() => onClose(false)}
      title={projectId ? 'Editar Proyecto' : 'Crear Proyecto'}
      fields={fields}
      initialData={initialData || {
        name: '',
        ticket_jira: '',
        creation_user: ''
      } as ProjectCreate}
      service={{
        createData: async (data) => {
          if (!user?.email) throw new Error('Usuario no autenticado');
          const dataWithUser = {
            ...data,
            creation_user: user.email
          };
          const result = await createData(dataWithUser as ProjectCreate, user.email, country);
          onClose(true);
          return result;
        },
        updateData: async (data) => {
          if (!user?.email) throw new Error('Usuario no autenticado');
          const dataWithUser = {
            ...data,
            update_user: user.email,
            ticket_jira: initialData?.ticket_jira || ''
          };
          const result = await updateData(dataWithUser as ProjectUpdateWithId, user.email, country);
          onClose(true);
          return result;
        }
      }}
      docId={projectId}
      mode={projectId ? 'edit' : 'create'}
    />
  );
}; 