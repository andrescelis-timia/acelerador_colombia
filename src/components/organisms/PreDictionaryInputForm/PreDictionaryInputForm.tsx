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
  initialData 
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

  const fields: FormFieldConfig[] = [
    {
      name: 'origin',
      label: 'Origen',
      placeholder: 'Ingrese el origen',
      type: 'input'
    },
    {
      name: 'app_product',
      label: 'Aplicativo Producto',
      placeholder: 'Ingrese el aplicativo o producto',
      type: 'input'
    },
    {
      name: 'name_origin',
      label: 'Nombre de origen',
      placeholder: 'Ingrese el nombre de origen',
      type: 'input'
    },
    {
      name: 'table_content_origin',
      label: 'Descripción de la tabla de contenido de origen',
      placeholder: 'Ingrese la descripción de la tabla de contenido de origen',
      type: 'input'
    },
    {
      name: 'table_raw_name',
      label: 'Nombre de tabla RAW',
      placeholder: 'Ingrese el nombre de la tabla RAW',
      type: 'input'
    },
    {
      name: 'table_master_name',
      label: 'Nombre de tabla MASTER',
      placeholder: 'Ingrese el nombre de la tabla MASTER',
      type: 'input'
    },        
    {
      name: 'information_group_level_2',
      label: 'Información de grupo nivel 2',
      placeholder: 'Ingrese la información de grupo nivel 2',
      type: 'input'
    },
    {
      name: 'number_records_period_intake',
      label: 'Cantidad de registros por periodo de ingesta',
      placeholder: 'Ingrese la cantidad de registros por periodo de ingesta',
      type: 'input'
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
      onClose={() => onClose(false)}
      title='Campos adicionales'
      fields={fields}
      initialData={initialData || defaultPreDictionary}
      service={{
        createData: async (data) => {
          if (!user?.email) throw new Error('Email required');
          const dataWithUser = {
            ...data,
            id_object: objectId
          };
          const result = await createPreDictionaryInput(dataWithUser as CreatePreDictionaryInput, user.email, country);
          onClose(true);
          return result;
        },
        updateData: async (data) => {
          if (!user?.email) throw new Error('Email required');
          if (!initialData?.id_pre_dictionary_input) throw new Error('ID required');
          const result = await updatePreDictionaryInput(initialData.id_pre_dictionary_input, data as UpdatePreDictionaryInput, user.email, country);
          onClose(true);
          return result;
        }
      }}
      docId={isEditing ? initialData.id_pre_dictionary_input : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 