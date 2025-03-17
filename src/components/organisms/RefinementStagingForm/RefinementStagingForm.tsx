import { memo, useState } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createStagingRefinement, updateStagingRefinement } from '@/services/Refinement';
import { RefinementStagingFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementStagingCreate, RefinementStagingUpdateWithId } from '@/services/Refinement/types';

export const RefinementStagingForm = memo(function RefinementStagingForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementStagingFormProps) {
  const { user, country } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;
  const [draftData, setDraftData] = useState<RefinementStagingCreate | null>(null);

  if (!objectId || !user?.email) return null;

  const defaultStaging: RefinementStagingCreate = {
    id_object: objectId,
    path_base_staging: '',
    path_staging: '',
    creation_user: user.email
  };

  const getInitialFormData = () => {
    if (isEditing) return initialData;
    return draftData || defaultStaging;
  };

  const handleFormClose = (success: boolean) => {
    if (success) {
      setDraftData(null);
    }
    onClose(success);
  };

  const handleFormChange = (data: RefinementStagingCreate | RefinementStagingUpdateWithId) => {
    if (!isEditing) {
      setDraftData(data as RefinementStagingCreate);
    }
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'path_base_staging',
      label: 'Path Base',
      placeholder: 'Ingrese la ruta base',
      type: 'input'
    },
    {
      name: 'path_staging',
      label: 'Path',
      placeholder: 'Ingrese la ruta',
      type: 'input'
    }
  ];

  return (
    <SlideForm<RefinementStagingCreate | RefinementStagingUpdateWithId>
      isOpen={isOpen}
      onClose={handleFormClose}
      title={isEditing ? 'Editar Staging' : 'Crear Staging'}
      fields={fields}
      initialData={getInitialFormData()}
      onFormChange={handleFormChange}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user.email as string
          };
          const result = await createStagingRefinement(dataWithUser as RefinementStagingCreate, user.email as string, country);
          handleFormClose(true);
          return result;
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
          const result = await updateStagingRefinement(dataWithUser as RefinementStagingUpdateWithId, user.email as string, country);
          handleFormClose(true);
          return result;
        }
      }}
      docId={isEditing ? (initialData as RefinementStagingUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 