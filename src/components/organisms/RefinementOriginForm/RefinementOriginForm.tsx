'use client';

import { SlideForm } from '@/components/organisms/SlideForm';
import { FormFieldConfig } from '@/components/organisms/SlideForm/types';
import { createOriginRefinement, updateOriginRefinement } from '@/services/Refinement';
import { RefinementOriginFormProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { RefinementOriginUpdateWithId } from '@/services/Refinement/types';
import { RefinementOriginCreate } from '@/services/Refinement/types';
import { memo } from 'react';

export const RefinementOriginForm = memo(function RefinementOriginForm({ 
  isOpen, 
  onClose, 
  objectId, 
  initialData 
}: RefinementOriginFormProps) {
  const { user } = useAuth();
    
  const isEditing = initialData && 'id_refinement' in initialData;  

  if (!objectId) return null;

  const defaultOrigin: RefinementOriginCreate = {
    id_object: objectId,
    responsable_origin: '',
    app_product_origin: '',
    source_origin: '',
    frequency_origin: '',
    name_origin: '',
    table_description_origin: '',
    table_content_origin: '',
    flag_table_events_origin: false,
    update_data_event_origin: '',
    update_date_event_origin: '',
    update_date_value_origin: '',
    copy_cobol_origin: '',
    mapping_origin: '',
    primary_key_table_origin: '',
    flag_table_backup_origin: false,
    flag_update_origin_key_origin: false,
    number_fields_origin: 0,
    flag_table_depuration_origin: false,
    table_content_staying_origin: '',
    depure_table_origin: '',
    moment_table_taken_origin: '',
    creation_user: user?.email || ''
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'responsable_origin',
      label: 'Responsable',
      placeholder: 'Ingrese el responsable',
      type: 'input'
    },
    {
      name: 'app_product_origin',
      label: 'Aplicativo producto',
      placeholder: 'Ingrese el aplicativo producto',
      type: 'input'
    },
    {
      name: 'source_origin',
      label: 'Origen',
      placeholder: 'Ingrese el origen',
      type: 'input'
    },
    {
      name: 'frequency_origin',
      label: 'Frecuencia de actualizacion de datos en origen',
      placeholder: 'Ingrese la frecuencia',
      type: 'input'
    },
    {
      name: 'name_origin',
      label: 'Nombre origen',
      placeholder: 'Ingrese el nombre origen',
      type: 'input'
    },
    {
      name: 'table_description_origin',
      label: 'Descripcion del contenido de la tabla',
      placeholder: 'Ingrese la descripción',
      type: 'textarea'
    },
    {
      name: 'table_content_origin',
      label: 'Contenido de la tabla',
      placeholder: 'Ingrese el contenido',
      type: 'textarea'
    },
    {
      name: 'flag_table_events_origin',
      label: 'Tabla de eventos',
      type: 'checkbox'
    },
    {
      name: 'update_data_event_origin',
      label: 'Si la tabla es de Eventos, ¿Se actualiza algún dato del evento?',
      placeholder: 'Ingrese la actualización',
      type: 'input'
    },
    {
      name: 'update_date_event_origin',
      label: 'Si la tabla es de Eventos, ¿Los datos de esta tabla de eventos se actualizan según la fecha valor (Solo las del día)?',
      placeholder: 'Ingrese SI o NO',
      type: 'input'
    },
    {
      name: 'update_date_value_origin',
      label: 'A qué fecha refiere la información que vamos a disponer en datio',
      placeholder: 'Ingrese el valor',
      type: 'input'
    },
    {
      name: 'copy_cobol_origin',
      label: 'Copy Cobol',
      placeholder: 'Ingrese la copia COBOL',
      type: 'textarea'
    },
    {
      name: 'mapping_origin',
      label: 'Mapping',
      placeholder: 'Ingrese el mapping',
      type: 'textarea'
    },
    {
      name: 'primary_key_table_origin',
      label: 'Claves primarias de la tabla',
      placeholder: 'Ingrese las claves primarias',
      type: 'input'
    },
    {
      name: 'flag_table_backup_origin',
      label: 'Tabla de respaldo',
      type: 'checkbox'
    },
    {
      name: 'flag_update_origin_key_origin',
      label: 'La clave primaria se actualiza en el origen?',
      type: 'checkbox'
    },
    {
      name: 'number_fields_origin',
      label: 'Cantidad de campos?',
      placeholder: 'Ingrese la cantidad de campos',
      type: 'input'
    },
    {
      name: 'flag_table_depuration_origin',
      label: 'La tabla realiza depuraciones en el origen?',
      type: 'checkbox'
    },
    {
      name: 'table_content_staying_origin',
      label: 'Que perdura en la tabla?',
      placeholder: 'Ingrese el contenido que perdura',
      type: 'textarea'
    },
    {
      name: 'depure_table_origin',
      label: 'Que se depura en la tabla?',
      placeholder: 'Ingrese el contenido que se depura',
      type: 'textarea'
    },
    {
      name: 'moment_table_taken_origin',
      label: '¿En qué momento puedo tomar la tabla para traerla a Datio y que me asegure que está correctamente actualizada y que tiene integridad?',
      placeholder: 'Ingrese el momento',
      type: 'input'
    }
  ];

  return (
    <SlideForm<RefinementOriginCreate | RefinementOriginUpdateWithId>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Origen' : 'Crear Origen'}
      fields={fields}
      initialData={initialData || defaultOrigin}
      service={{
        createData: async (data) => {
          const dataWithUser = {
            ...data,
            id_object: objectId,
            creation_user: user?.email || ''
          };
          return createOriginRefinement(dataWithUser);
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
          return updateOriginRefinement(dataWithUser as RefinementOriginUpdateWithId);
        }
      }}
      docId={isEditing ? (initialData as RefinementOriginUpdateWithId).id_refinement : undefined}
      mode={isEditing ? 'edit' : 'create'}
    />
  );
}); 