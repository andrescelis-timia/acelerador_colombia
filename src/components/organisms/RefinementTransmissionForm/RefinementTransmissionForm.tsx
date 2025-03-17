import { memo, useState } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createTransmissionRefinement, updateTransmissionRefinement } from '@/services/Refinement';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementTransmissionCreate, RefinementTransmissionUpdateWithId } from '@/services/Refinement/types';
import { RefinementTransmissionFormProps } from './types';

export const RefinementTransmissionForm = memo(function RefinementTransmissionForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementTransmissionFormProps) {
  const { user, country } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;
  const [draftData, setDraftData] = useState<RefinementTransmissionCreate | null>(null);

  if (!objectId || !user?.email) return null;

  const defaultTransmission: RefinementTransmissionCreate = {
    id_object: objectId,
    content_transmission: '',
    news_transmission: '',
    field_transmission: '',
    creation_user: user.email
  };

  const getInitialFormData = () => {
    if (isEditing) return initialData;
    return draftData || defaultTransmission;
  };

  const handleFormClose = (success: boolean) => {
    if (success) {
      setDraftData(null);
    }
    onClose(success);
  };

  const handleFormChange = (data: RefinementTransmissionCreate | RefinementTransmissionUpdateWithId) => {
    if (!isEditing) {
      setDraftData(data as RefinementTransmissionCreate);
    }
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'content_transmission',
      label: '¿Qué conviene transmitir?',
      placeholder: 'Ingrese el contenido',
      type: 'textarea'
    },
    {
      name: 'news_transmission',
      label: 'Si conviene transmitir novedades, ¿Cómo se identifican?',
      placeholder: 'Ingrese las novedades',
      type: 'textarea'
    },
    {
      name: 'field_transmission',
      label: '¿Por cuál campo se identifican?',
      placeholder: 'Ingrese el campo',
      type: 'input'
    }
  ];

  return (
    <SlideForm<RefinementTransmissionCreate | RefinementTransmissionUpdateWithId>
      isOpen={isOpen}
      onClose={handleFormClose}
      title={isEditing ? 'Editar Transmisión' : 'Crear Transmisión'}
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
          const result = await createTransmissionRefinement(dataWithUser as RefinementTransmissionCreate, user.email as string, country);
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
          const result = await updateTransmissionRefinement(dataWithUser as RefinementTransmissionUpdateWithId, user.email as string, country);
          handleFormClose(true);
          return result;
        }
      }}
      docId={isEditing ? (initialData as RefinementTransmissionUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 