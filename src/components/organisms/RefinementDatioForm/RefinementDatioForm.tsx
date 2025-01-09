import { memo } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createDatioRefinement, updateDatioRefinement } from '@/services/Refinement';
import { RefinementDatioFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementDatioCreate, RefinementDatioUpdateWithId } from '@/services/Refinement/types';

export const RefinementDatioForm = memo(function RefinementDatioForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementDatioFormProps) {
  const { user } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;

  if (!objectId) return null;

  const defaultDatio: RefinementDatioCreate = {
    id_object: objectId,
    responsable_datio: '',
    table_name_datio: '',
    use_case_datio: '',
    product_owner_datio: '',
    table_primary_keys_datio: '',
    flag_update_key_datio: false,
    historical_datio: '',
    intake_period_datio: '',
    number_records_intake_datio: 0,
    flag_net_controlm_datio: false,
    creation_user: user?.email || ''
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'responsable_datio',
      label: 'Responsable del refinamiento',
      placeholder: 'Ingrese el responsable',
      type: 'input'
    },
    {
      name: 'table_name_datio',
      label: 'Nombre de la tabla en Datio',
      placeholder: 'Ingrese el nombre de la tabla',
      type: 'input'
    },
    {
      name: 'use_case_datio',
      label: 'Caso de uso para el cual se ingesta la información',
      placeholder: 'Ingrese el caso de uso',
      type: 'input'
    },
    {
      name: 'product_owner_datio',
      label: 'Product Owner del proyecto que necesita la información',
      placeholder: 'Ingrese el Product Owner',
      type: 'input'
    },
    {
      name: 'table_primary_keys_datio',
      label: 'Claves primarias de la tabla',
      placeholder: 'Ingrese las claves primarias',
      type: 'input'
    },
    {
      name: 'flag_update_key_datio',
      label: '¿La clave primaria se actualiza Datio?',
      type: 'checkbox'
    },
    {
      name: 'historical_datio',
      label: 'Historia requerida por Negocio / PO',
      placeholder: 'Ingrese el histórico',
      type: 'input'
    },
    {
      name: 'intake_period_datio',
      label: 'Período de ingesta',
      placeholder: 'Ingrese el período de ingesta',
      type: 'input'
    },
    {
      name: 'number_records_intake_datio',
      label: 'Cant Registros x periodo de ingesta (aproximado)',
      placeholder: 'Ingrese el número de registros',
      type: 'input'
    },
    {
      name: 'flag_net_controlm_datio',
      label: 'Tiene Malla CtrolM?',
      type: 'checkbox'
    }
  ];

  return (
    <SlideForm<RefinementDatioCreate | RefinementDatioUpdateWithId>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Datio' : 'Crear Datio'}
      fields={fields}
      initialData={initialData || defaultDatio}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user?.email || ''
          };
          return createDatioRefinement(dataWithUser);
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
          return updateDatioRefinement(dataWithUser as RefinementDatioUpdateWithId);
        }
      }}
      docId={isEditing ? (initialData as RefinementDatioUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 