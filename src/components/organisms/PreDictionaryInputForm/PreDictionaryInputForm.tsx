import { memo } from 'react';
import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createPreDictionaryInput, updatePreDictionaryInput } from '@/services/PreDictionaryInput';
import { PreDictionaryInputFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { CreatePreDictionaryInput, UpdatePreDictionaryInput } from '@/services/PreDictionaryInput/types';

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
    table_raw_name: '',
    table_master_name: '',
    partition_fields_raw: '',
    aggregate_fields_raw: '',
    path_input_raw: '',
    path_output_raw: '',
    path_input_master: '',
    path_output_master: '',
    aggregate_fields_master: ''
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
      name: 'partition_fields_raw',
      label: 'Campos de partición RAW',
      placeholder: 'Ingrese los campos de partición RAW',
      type: 'input'
    },
    {
      name: 'aggregate_fields_raw',
      label: 'Campos de agregación RAW',
      placeholder: 'Ingrese los campos de agregación RAW',
      type: 'input'
    },
    {
      name: 'path_input_raw',
      label: 'Path input RAW',
      placeholder: 'Ingrese el path input RAW',
      type: 'input'
    },
    {
      name: 'path_output_raw',
      label: 'Path output RAW',
      placeholder: 'Ingrese el path output RAW',
      type: 'input'
    },
    {
      name: 'path_input_master',
      label: 'Path input MASTER',
      placeholder: 'Ingrese el path input MASTER',
      type: 'input'
    },
    {
      name: 'path_output_master',
      label: 'Path output MASTER',
      placeholder: 'Ingrese el path output MASTER',
      type: 'input'
    },
    {
      name: 'aggregate_fields_master',
      label: 'Campos de agregación MASTER',
      placeholder: 'Ingrese los campos de agregación MASTER',
      type: 'input'
    }
  ];

  return (
    <SlideForm<CreatePreDictionaryInput | UpdatePreDictionaryInput>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Pre-Diccionario' : 'Crear Pre-Diccionario'}
      fields={fields}
      initialData={initialData || defaultPreDictionary}
      service={{
        createData: async (data) => {
          if (!user?.email) throw new Error('Email required');
          const dataWithUser = {
            ...data,
            id_object: objectId
          };
          return createPreDictionaryInput(dataWithUser as CreatePreDictionaryInput, user.email, country);
        },
        updateData: async (data) => {
          if (!user?.email) throw new Error('Email required');
          if (!initialData?.id_pre_dictionary_input) throw new Error('ID required');
          return updatePreDictionaryInput(initialData.id_pre_dictionary_input, data as UpdatePreDictionaryInput, user.email, country);
        }
      }}
      docId={isEditing ? initialData.id_pre_dictionary_input : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 