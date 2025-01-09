import { memo } from 'react';
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
  const { user } = useAuth();
  const isEditing = initialData && 'id_refinement' in initialData;

  if (!objectId) return null;

  const defaultTransmission: RefinementTransmissionCreate = {
    id_object: objectId,
    content_transmission: '',
    news_transmission: '',
    field_transmission: '',
    creation_user: user?.email || ''
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
      onClose={onClose}
      title={isEditing ? 'Editar Transmisión' : 'Crear Transmisión'}
      fields={fields}
      initialData={initialData || defaultTransmission}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user?.email || ''
          };
          return createTransmissionRefinement(dataWithUser);
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
          return updateTransmissionRefinement(dataWithUser as RefinementTransmissionUpdateWithId);
        }
      }}
      docId={isEditing ? (initialData as RefinementTransmissionUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 