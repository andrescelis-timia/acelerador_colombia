import { memo } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createMasterRefinement, updateMasterRefinement } from '@/services/Refinement';
import { RefinementMasterFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementMasterCreate, RefinementMasterUpdateWithId } from '@/services/Refinement/types';

export const RefinementMasterForm = memo(function RefinementMasterForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementMasterFormProps) {
  const { user } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;

  if (!objectId) return null;

  const defaultMaster: RefinementMasterCreate = {
    id_object: objectId,
    variables_controlm_format_master: '',
    partition_fields_master: '',
    intake_mode_master: '',
    motive_intake_mode_master: '',
    reprocess_fields_master: '',
    aggregate_fields_master: '',
    path_input_master: '',
    path_output_base_master: '',
    path_output_master: '',
    filters_pre_intake_master: '',
    observations_master: '',
    creation_user: user?.email || ''
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'variables_controlm_format_master',
      label: 'Variables de CtrolM, su cálculo y formato',
      placeholder: 'Ingrese el formato',
      type: 'input'
    },
    {
      name: 'partition_fields_master',
      label: 'Campos de Partición y por qué?',
      placeholder: 'Ingrese los campos',
      type: 'input'
    },
    {
      name: 'intake_mode_master',
      label: 'Modo de ingesta (Kirby)',
      placeholder: 'Ingrese el modo',
      type: 'input'
    },
    {
      name: 'motive_intake_mode_master',
      label: 'Motivos del Modo de ingesta definido',
      placeholder: 'Ingrese el motivo',
      type: 'textarea'
    },
    {
      name: 'reprocess_fields_master',
      label: 'En caso de ser reprocess: ¿Por cuáles campos reprocesa? ¿Qué variable de control-M utiliza?',
      placeholder: 'Ingrese los campos',
      type: 'input'
    },
    {
      name: 'aggregate_fields_master',
      label: 'Campos agregados. ¿Con qué valor se llenan?',
      placeholder: 'Ingrese los campos',
      type: 'input'
    },
    {
      name: 'path_input_master',
      label: 'Path Input',
      placeholder: 'Ingrese la ruta',
      type: 'input'
    },
    {
      name: 'path_output_base_master',
      label: 'Path Output Base',
      placeholder: 'Ingrese la ruta base',
      type: 'input'
    },
    {
      name: 'path_output_master',
      label: 'Path Output',
      placeholder: 'Ingrese la ruta',
      type: 'input'
    },
    {
      name: 'filters_pre_intake_master',
      label: 'Filtros antes de ingestar la información',
      placeholder: 'Ingrese los filtros',
      type: 'textarea'
    },
    {
      name: 'observations_master',
      label: 'Observaciones',
      placeholder: 'Ingrese las observaciones',
      type: 'textarea'
    }
  ];

  return (
    <SlideForm<RefinementMasterCreate | RefinementMasterUpdateWithId>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Master' : 'Crear Master'}
      fields={fields}
      initialData={initialData || defaultMaster}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user?.email || ''
          };
          return createMasterRefinement(dataWithUser);
        },
        updateData: async (data) => {
          if (!initialData?.id_refinement) {
            throw new Error('ID de refinamiento no encontrado');
          }
          const dataWithUser = {
            ...data,
            id_refinement: initialData.id_refinement,
            update_user: user?.email || ''
          };
          return updateMasterRefinement(dataWithUser as RefinementMasterUpdateWithId);
        }
      }}
      docId={isEditing ? (initialData as RefinementMasterUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 