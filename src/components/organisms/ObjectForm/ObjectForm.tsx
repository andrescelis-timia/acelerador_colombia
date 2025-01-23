'use client';

import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createData, updateData } from '@/services/Object';
import { ObjectFormProps } from './types';
import { ObjectCreate, ObjectUpdateWithId } from '@/services/Object/types';
import { useAuth } from '@/lib/context/AuthContext';

export const ObjectForm: React.FC<ObjectFormProps> = ({ isOpen, onClose, projectId, initialData }) => {
  const { user, country } = useAuth();

  if (!projectId) return null;

  const defaultObject: ObjectCreate = {
    id_project: projectId,
    name: '',
    alias: '',
    url_document: '',
    status: 'pending',
    creation_user: user?.email || ''
  };

  const isEditing = initialData && 'id_object' in initialData;

  const fields: FormFieldConfig[] = isEditing ? [
    {
      name: 'name',
      label: 'Nombre Legacy',
      placeholder: 'Ingrese el nombre legacy',
      type: 'input' as const
    },
    {
      name: 'alias',
      label: 'Alias',
      placeholder: 'Ingrese el alias',
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
      name: 'name',
      label: 'Nombre Legacy',
      placeholder: 'Ingrese el nombre legacy',
      type: 'input' as const
    },
    {
      name: 'alias',
      label: 'Alias',
      placeholder: 'Ingrese el alias',
      type: 'input' as const
    },
    {
      name: 'url_document',
      label: 'Solicitud de Información',
      placeholder: 'Ingrese la URL de la solicitud',
      type: 'input' as const
    }
  ];

  return (
    <SlideForm<ObjectUpdateWithId | ObjectCreate>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Objeto' : 'Crear Objeto'}
      fields={fields}
      initialData={initialData || defaultObject}
      service={{
        createData: async (data) => {
          if (!user?.email) throw new Error('Usuario no autenticado');
          const dataWithUser = {
            ...data,
            id_project: projectId,
            creation_user: user.email
          };
          return createData(dataWithUser as ObjectCreate, user.email, country);
        },
        updateData: async (data) => {
          if (!user?.email) throw new Error('Usuario no autenticado');
          const dataWithUser = {
            ...data,
            update_user: user.email
          };
          return updateData(dataWithUser as ObjectUpdateWithId, user.email, country);
        }
      }}
      docId={isEditing ? (initialData as ObjectUpdateWithId).id_object : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}; 