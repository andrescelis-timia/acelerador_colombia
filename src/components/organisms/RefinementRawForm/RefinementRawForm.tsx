import { memo } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createRawRefinement, updateRawRefinement } from '@/services/Refinement';
import { RefinementRawFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementRawCreate, RefinementRawUpdateWithId } from '@/services/Refinement/types';

export const RefinementRawForm = memo(function RefinementRawForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementRawFormProps) {
  const { user, country } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;

  if (!objectId || !user?.email) return null;

  const defaultRaw: RefinementRawCreate = {
    id_object: objectId,
    variables_controlm_format_raw: '',
    partition_fields_raw: '',
    intake_mode_raw: '',
    motive_intake_mode_raw: '',
    reprocess_fields_raw: '',
    aggregate_fields_raw: '',
    path_input_raw: '',
    path_output_base_raw: '',
    path_output_raw: '',
    filters_pre_intake_raw: '',
    observations_raw: '',
    creation_user: user.email
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'variables_controlm_format_raw',
      label: 'Variables de CtrolM, su cálculo y formato',
      placeholder: 'Ingrese el formato',
      type: 'input'
    },
    {
      name: 'partition_fields_raw',
      label: 'Campos de Partición y por qué?',
      placeholder: 'Ingrese los campos',
      type: 'input'
    },
    {
      name: 'intake_mode_raw',
      label: 'Modo de ingesta (Kirby)',
      placeholder: 'Ingrese el modo',
      type: 'input'
    },
    {
      name: 'motive_intake_mode_raw',
      label: 'Motivos del Modo de ingesta definido',
      placeholder: 'Ingrese el motivo',
      type: 'textarea'
    },
    {
      name: 'reprocess_fields_raw',
      label: 'En caso de ser reprocess: ¿Por cuáles campos reprocesa? ¿Qué variable de control-M utiliza?',
      placeholder: 'Ingrese los campos',
      type: 'input'
    },
    {
      name: 'aggregate_fields_raw',
      label: 'Campos agregados. ¿Con qué valor se llenan?',
      placeholder: 'Ingrese los campos',
      type: 'input'
    },
    {
      name: 'path_input_raw',
      label: 'Path Input',
      placeholder: 'Ingrese la ruta',
      type: 'input'
    },
    {
      name: 'path_output_base_raw',
      label: 'Path Output Base',
      placeholder: 'Ingrese la ruta base',
      type: 'input'
    },
    {
      name: 'path_output_raw',
      label: 'Path Output',
      placeholder: 'Ingrese la ruta',
      type: 'input'
    },
    {
      name: 'filters_pre_intake_raw',
      label: 'Filtros antes de ingestar la información',
      placeholder: 'Ingrese los filtros',
      type: 'textarea'
    },
    {
      name: 'observations_raw',
      label: 'Observaciones',
      placeholder: 'Ingrese las observaciones',
      type: 'textarea'
    }
  ];

  return (
    <SlideForm<RefinementRawCreate | RefinementRawUpdateWithId>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Raw' : 'Crear Raw'}
      fields={fields}
      initialData={initialData || defaultRaw}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user.email as string
          };
          return createRawRefinement(dataWithUser as RefinementRawCreate, user.email as string, country);
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
          return updateRawRefinement(dataWithUser as RefinementRawUpdateWithId, user.email as string, country);
        }
      }}
      docId={isEditing ? (initialData as RefinementRawUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 