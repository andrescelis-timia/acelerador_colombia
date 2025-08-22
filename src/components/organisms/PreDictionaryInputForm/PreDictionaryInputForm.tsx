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
    periodicity: country === 'CO' ? PreDictionaryPeriodicity.DAILY : PreDictionaryPeriodicity.NOT_SPECIFIED,
    partition_fields_raw: '',
    partition_fields_master: '',
    aggregate_fields_raw: '',
    aggregate_fields_master: ''
  };

  const getInitialFormData = () => {
    if (isEditing) {
      if (country === 'HO') {
        return {
          ...initialData,
          periodicity: PreDictionaryPeriodicity.NOT_SPECIFIED
        };
      }
      return initialData;
    }
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

  const baseFields: FormFieldConfig[] = [
    {
      name: 'origin',
      label: 'Sistema origen',
      placeholder: 'Ejemplo: Host, Oracle, Usuario, etc.',
      type: 'input',
      required: true
    },
    {
      name: 'app_product',
      label: 'Aplicativo Origen',
      placeholder: 'Ejemplo: Personas, Riesgos, Altamira, etc.',
      type: 'input',
      required: true
    },
    {
      name: 'name_origin',
      label: 'Nombre Legacy del objeto',
      placeholder: 'Ejemplo: PEDT00X, Parametria_xx, etc.',
      type: 'input',
      required: true
    },
    {
      name: 'table_content_origin',
      label: 'Descripción Legacy del objeto',
      placeholder: 'Ingrese la descripción de la tabla de contenido de origen',
      type: 'input',
      required: true
    },
    {
      name: 'information_group_level_2',
      label: 'Descripción Level 3 (Fresno)',
      placeholder: 'Descripción según la UUAA master',
      type: 'input',
      required: true
    },
    {
      name: 'table_raw_name',
      label: 'Nombre de tabla RAW',
      placeholder: 'Ejemplo: t_xxxx_alias_descripcion',
      type: 'input',
      required: true
    },
    {
      name: 'table_master_name',
      label: 'Nombre de tabla MASTER',
      placeholder: 'Ejemplo: t_yyyy_alias_descripcion',
      type: 'input',
      required: true
    },
    {
      name: 'number_records_period_intake',
      label: 'Cantidad de registros del objeto',
      placeholder: 'Ejemplo: 1000, 5000, etc.',
      type: 'input',
      required: true,
      pattern: '^[0-9]+$',
      errorMessage: 'Este campo solo acepta números enteros positivos',
      min: '0',
      inputMode: 'numeric'
    }
  ];

  const coFields: FormFieldConfig[] = [
    ...baseFields,
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

  const hoFields: FormFieldConfig[] = [
    ...baseFields,
    {
      name: 'partition_fields_raw',
      label: 'Campos de partición RAW',
      placeholder: 'Ingrese los campos de partición RAW',
      type: 'input',
      required: true
    },
    {
      name: 'partition_fields_master',
      label: 'Campos de partición MASTER',
      placeholder: 'Ingrese los campos de partición MASTER',
      type: 'input',
      required: true
    },
    {
      name: 'aggregate_fields_raw',
      label: 'Campos de agregación RAW',
      placeholder: 'Ingrese los campos de agregación RAW',
      type: 'input',
      required: true
    },
    {
      name: 'aggregate_fields_master',
      label: 'Campos de agregación MASTER',
      placeholder: 'Ingrese los campos de agregación MASTER',
      type: 'input',
      required: true
    }
  ];

  const fields = country === 'CO' ? coFields : hoFields;

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