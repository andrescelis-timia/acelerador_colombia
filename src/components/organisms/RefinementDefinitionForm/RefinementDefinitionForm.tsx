import { memo } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createDefinitionRefinement, updateDefinitionRefinement } from '@/services/Refinement';
import { RefinementDefinitionFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementDefinitionCreate, RefinementDefinitionUpdateWithId } from '@/services/Refinement/types';

export const RefinementDefinitionForm = memo(function RefinementDefinitionForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementDefinitionFormProps) {
  const { user, country } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;

  if (!objectId || !user?.email) return null;

  const defaultDefinition: RefinementDefinitionCreate = {
    id_object: objectId,
    execution_frequency_definition: '',
    calendar_controlm_definition: '',
    table_file_content_definition: '',
    received_staging_filename_definition: '',
    table_raw_name_definition: '',
    table_master_name_definition: '',
    creation_user: user.email
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'execution_frequency_definition',
      label: 'Frecuencia de ejecución',
      placeholder: 'Ingrese la frecuencia de ejecución',
      type: 'input'
    },
    {
      name: 'calendar_controlm_definition',
      label: 'Calendario Control-M',
      placeholder: 'Ingrese el calendario',
      type: 'input'
    },
    {
      name: 'table_file_content_definition',
      label: 'Contenido de Tabla/Archivo',
      placeholder: 'Ingrese el contenido',
      type: 'textarea'
    },
    {
      name: 'received_staging_filename_definition',
      label: 'Nombre Archivo Recibido en Staging',
      placeholder: 'Ingrese el nombre del archivo',
      type: 'input'
    },
    {
      name: 'table_raw_name_definition',
      label: 'Tabla en RAW',
      placeholder: 'Ingrese el nombre de la tabla',
      type: 'input'
    },
    {
      name: 'table_master_name_definition',
      label: 'Tabla en MASTER',
      placeholder: 'Ingrese el nombre de la tabla',
      type: 'input'
    }
  ];

  return (
    <SlideForm<RefinementDefinitionCreate | RefinementDefinitionUpdateWithId>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Definición' : 'Crear Definición'}
      fields={fields}
      initialData={initialData || defaultDefinition}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user.email as string
          };
          return createDefinitionRefinement(dataWithUser as RefinementDefinitionCreate, user.email as string, country);
        },
        updateData: async (data) => {
          if (!initialData?.id_refinement) {
            throw new Error('ID de refinamiento no encontrado');
          }
          const dataWithUser = {
            ...data,
            id_refinement: initialData.id_refinement,
            update_user: user.email as string
          };
          return updateDefinitionRefinement(dataWithUser as RefinementDefinitionUpdateWithId, user.email as string, country);
        }
      }}
      docId={isEditing ? (initialData as RefinementDefinitionUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 