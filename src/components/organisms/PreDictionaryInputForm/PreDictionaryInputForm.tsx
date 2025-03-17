import { memo } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createPreDictionaryInput, updatePreDictionaryInput } from '@/services/PreDictionaryInput';
import { PreDictionaryInputFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { CreatePreDictionaryInput, UpdatePreDictionaryInput, PreDictionaryPeriodicity } from '@/services/PreDictionaryInput/types';

export const PreDictionaryInputForm = memo(function PreDictionaryInputForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData,
  draftData,
  onDraftChange
}: PreDictionaryInputFormProps) {
  const { user, country = 'CO' } = useAuth();
  const isEditing = initialData && 'id_pre_dictionary_input' in initialData;

  if (!objectId || !user?.email || !country) return null;

  const defaultPreDictionary: CreatePreDictionaryInput = {
    id_object: objectId,
    origin: '',
    app_product: '',
    name_origin: '',
    table_content_origin: '',
    table_raw_name: '',
    table_master_name: '',
    information_group_level_2: '',
    number_records_period_intake: '',
    periodicity: PreDictionaryPeriodicity.DAILY    
  };

  const getInitialFormData = () => {
    if (isEditing) return initialData;
    return draftData || defaultPreDictionary;
  };

  const handleFormClose = (success: boolean) => {
    if (success) {
      onDraftChange(null);
    }
    onClose(success);
  };

  const handleFormChange = (data: CreatePreDictionaryInput | UpdatePreDictionaryInput) => {
    if (!isEditing) {
      onDraftChange(data as CreatePreDictionaryInput);
    }
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'origin',
      label: 'Origen',
      placeholder: 'Ingrese el origen',
      type: 'input',
      required: true
    },
    {
      name: 'app_product',
      label: 'Aplicativo Producto',
      placeholder: 'Ingrese el aplicativo o producto',
      type: 'input',
      required: true
    },
    {
      name: 'name_origin',
      label: 'Nombre de origen',
      placeholder: 'Ingrese el nombre de origen',
      type: 'input',
      required: true
    },
    {
      name: 'table_content_origin',
      label: 'Descripción de la tabla de contenido de origen',
      placeholder: 'Ingrese la descripción de la tabla de contenido de origen',
      type: 'input',
      required: true
    },
    {
      name: 'table_raw_name',
      label: 'Nombre de tabla RAW',
      placeholder: 'Ingrese el nombre de la tabla RAW',
      type: 'input',
      required: true
    },
    {
      name: 'table_master_name',
      label: 'Nombre de tabla MASTER',
      placeholder: 'Ingrese el nombre de la tabla MASTER',
      type: 'input',
      required: true
    },        
    {
      name: 'information_group_level_2',
      label: 'Información de grupo nivel 2',
      placeholder: 'Ingrese la información de grupo nivel 2',
      type: 'input',
      required: true
    },
    {
      name: 'number_records_period_intake',
      label: 'Cantidad de registros por periodo de ingesta',
      placeholder: 'Ingrese la cantidad de registros por periodo de ingesta',
      type: 'input',
      required: true,
      pattern: '^[0-9]+$',
      errorMessage: 'Este campo solo acepta números enteros positivos',
      min: '0',
      inputMode: 'numeric'
    },
    {
      name: 'periodicity',
      label: 'Periodicidad',
      placeholder: 'Seleccione la periodicidad',
      type: 'select' as const,
      required: true,
      options: [
        { value: PreDictionaryPeriodicity.DAILY, label: 'Diario' },
        { value: PreDictionaryPeriodicity.WEEKLY, label: 'Semanal' },
        { value: PreDictionaryPeriodicity.MONTHLY, label: 'Mensual' },
        { value: PreDictionaryPeriodicity.YEARLY, label: 'Anual' }
      ]
    }
  ];

  return (
    <SlideForm<CreatePreDictionaryInput | UpdatePreDictionaryInput>
      isOpen={isOpen}
      onClose={handleFormClose}
      title='Campos adicionales'
      fields={fields}
      initialData={getInitialFormData()}
      onFormChange={handleFormChange}
      service={{
        createData: async (data) => {
          if (!user?.email) throw new Error('Email required');
          const dataWithUser = {
            ...data,
            id_object: objectId
          };
          const result = await createPreDictionaryInput(dataWithUser as CreatePreDictionaryInput, user.email, country);
          handleFormClose(true);
          return result;
        },
        updateData: async (data) => {
          if (!user?.email) throw new Error('Email required');
          if (!initialData?.id_pre_dictionary_input) throw new Error('ID required');
          const result = await updatePreDictionaryInput(initialData.id_pre_dictionary_input, data as UpdatePreDictionaryInput, user.email, country);
          handleFormClose(true);
          return result;
        }
      }}
      docId={isEditing ? initialData.id_pre_dictionary_input : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 