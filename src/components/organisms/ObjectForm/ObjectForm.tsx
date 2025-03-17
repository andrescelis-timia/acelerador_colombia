'use client';

import { useState } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createData, updateData } from '@/services/Object';
import { ObjectFormProps } from './types';
import { ObjectCreate, ObjectUpdateWithId } from '@/services/Object/types';
import { useAuth } from '@/lib/context/AuthContext';

export const ObjectForm: React.FC<ObjectFormProps> = ({ isOpen, onClose, projectId, initialData }) => {
  const { user, country } = useAuth();
  const [draftData, setDraftData] = useState<ObjectCreate | null>(null);

  if (!projectId) return null;

  const defaultObject: ObjectCreate = {
    id_project: projectId,
    name: '',
    alias: '',
    url_document: '',
    status: 'pending',
    creation_user: user?.email || '',
    flag_l1t: false
  };

  const isEditing = initialData && 'id_object' in initialData;

  // Determinar los datos iniciales basados en el modo y el estado del borrador
  const getInitialFormData = () => {
    if (isEditing) return initialData;
    return draftData || defaultObject;
  };

  const handleFormClose = (success: boolean) => {
    if (success) {
      // Si el formulario se guardó exitosamente, limpiamos el borrador
      setDraftData(null);
    }
    onClose(success);
  };

  const handleFormChange = (data: ObjectCreate | ObjectUpdateWithId) => {
    if (!isEditing) {
      // Solo guardamos el borrador en modo creación
      setDraftData(data as ObjectCreate);
    }
  };

  const fields: FormFieldConfig[] = isEditing ? [
    {
      name: 'name',
      label: 'Nombre Legacy',
      placeholder: 'Ingrese el nombre legacy',
      type: 'input' as const,
      required: true
    },
    {
      name: 'status',
      label: 'Estado',
      placeholder: 'Seleccione el estado',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'pending', label: 'Pendiente' },
        { value: 'in_progress', label: 'En Proceso' },
        { value: 'completed', label: 'Completado' }
      ]
    },
    {
      name: 'url_document',
      label: 'Enlace Pre-diccionario',
      placeholder: 'Ingrese la URL del pre-diccionario',
      type: 'input' as const,
      required: true,
      pattern: '^https?:\\/\\/[\\w\\-\\.]+\\.[a-zA-Z]{2,}[\\/\\w\\-\\._~:\\/?#@!$&\'\\(\\)\\*+,;=]*$',
      errorMessage: 'Por favor ingrese una URL válida (debe comenzar con http:// o https://)',
      inputMode: 'url'
    },
    {
      name: 'flag_l1t',
      label: '¿Tiene L1T?',
      type: 'checkbox',
      helperText: 'La marca L1T aplica a objetos que contengan identificativos personales (IP)'
    }
  ] : [
    {
      name: 'name',
      label: 'Nombre Legacy',
      placeholder: 'Ingrese el nombre legacy',
      type: 'input' as const,
      required: true
    },
    {
      name: 'url_document',
      label: 'Enlace Pre-diccionario',
      placeholder: 'Ingrese la URL del pre-diccionario',
      type: 'input' as const,
      required: true,
      pattern: '^https?:\\/\\/[\\w\\-\\.]+\\.[a-zA-Z]{2,}[\\/\\w\\-\\._~:\\/?#@!$&\'\\(\\)\\*+,;=]*$',
      errorMessage: 'Por favor ingrese una URL válida (debe comenzar con http:// o https://)',
      inputMode: 'url'
    },
    {
      name: 'flag_l1t',
      label: '¿Tiene L1T?',
      type: 'checkbox',
      helperText: 'La marca L1T aplica a objetos que contengan identificativos personales (IP)'
    }
  ];

  return (
    <SlideForm<ObjectUpdateWithId | ObjectCreate>
      isOpen={isOpen}
      onClose={handleFormClose}
      title={isEditing ? 'Editar Objeto' : 'Crear Objeto'}
      fields={fields}
      initialData={getInitialFormData()}
      onFormChange={handleFormChange}
      service={{
        createData: async (data) => {
          if (!user?.email) throw new Error('Usuario no autenticado');
          const dataWithUser = {
            ...data,
            id_project: projectId,
            alias: '',
            creation_user: user.email
          };
          const result = await createData(dataWithUser as ObjectCreate, user.email, country);
          handleFormClose(true);
          return result;
        },
        updateData: async (data) => {
          if (!user?.email) throw new Error('Usuario no autenticado');
          const dataWithUser = {
            ...data,
            alias: '',
            update_user: user.email
          };
          const result = await updateData(dataWithUser as ObjectUpdateWithId, user.email, country);
          handleFormClose(true);
          return result;
        }
      }}
      docId={isEditing ? (initialData as ObjectUpdateWithId).id_object : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}; 