import { useEffect, useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PopupLinks } from '@/components/molecules/PopupLinks';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { PreDictionaryInputForm } from '@/components/organisms/PreDictionaryInputForm';
import { DataGovernmentFlowProps, FileDictionaryJsonHeader } from './types';
import { getDictionaryJsonHeader } from '@/services/DictionaryJsonHeader';
import { CreateDictionaryJsonHeader, DictionaryJsonHeaderResponse } from '@/services/DictionaryJsonHeader/types';
import { getDictionaryJsonDetailsByHeaderId } from '@/services/DictionaryJsonDetail';
import { CreateDictionaryJsonDetail, DictionaryJsonDetailResponse } from '@/services/DictionaryJsonDetail/types';
import { getPreDictionaryInputByObjectId } from '@/services/PreDictionaryInput';
import { PreDictionaryInputResponse } from '@/services/PreDictionaryInput/types';
import { PlayIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { generateDictionaryJson, generateDictionaryBase } from '@/services/DictionaryGenerator';
import { useAuth } from '@/lib/context/AuthContext';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';

const gridLayout = [
  { x: 0, y: 0 }, // sample
  { x: 1, y: 0 }, // dictionary
];

const flowStepsConfig = [
  { id: 'sample', title: 'Muestra', schema: 'txt, csv' },
  { id: 'dictionary', title: 'Diccionario', schema: 'json' },
];

export const DataGovernmentFlowCO = ({ objectId }: DataGovernmentFlowProps) => {
  const { user, country = 'CO' } = useAuth();
  const [dictionaryJsonHeader, setDictionaryJsonHeader] = useState<DictionaryJsonHeaderResponse | null>(null);
  const [dictionaryJsonDetails, setDictionaryJsonDetails] = useState<DictionaryJsonDetailResponse[]>([]);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [preDictionary, setPreDictionary] = useState<PreDictionaryInputResponse | null>(null);
  const [isLinksPopupOpen, setIsLinksPopupOpen] = useState(false);
  const [ingestaOutput, setIngestaOutput] = useState<IngestaOutputResponse | null>(null);
  const [showSampleProgress, setShowSampleProgress] = useState(false);
  const [showDictionaryProgress, setShowDictionaryProgress] = useState(false);
  const [dictionaryFile, setDictionaryFile] = useState<File | null>(null);
  const [dictionaryFileContent, setDictionaryFileContent] = useState<string | null>(null);

  const stepsConfig = {
    sample: [
      { label: 'Procesando muestra', duration: 500 },
      { label: 'Validando datos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
    ],
    dictionary: [
      { label: 'Inicializando acceso a APIs, bases de datos y almacenamiento en la nube', duration: 13500 },
      { label: 'Cargando archivos de entrada y configuraciones desde la nube', duration: 13500 },
      { label: 'Verificando y aplicando reglas y formatos específicos del país', duration: 13500 },
      { label: 'Creando estructura base del diccionario para tablas raw', duration: 13500 },
      { label: 'Creando estructura base del diccionario para tablas master', duration: 13500 },
      { label: 'Identificando y validando relaciones entre campos raw y master', duration: 13500 },
      { label: 'Ejecutando IA para analizar y enriquecer metadatos, nombres y descripciones de campos', duration: 13500 },
      { label: 'Aplicando formatos estándar y validaciones a todos los campos', duration: 13500 },
      { label: 'Creando diccionarios de datos detallados y mapeos de campos', duration: 13500 },
      { label: 'Validando relaciones y dependencias entre diccionarios', duration: 13500 },
      { label: 'Creando y guardando archivos CSV finales con todos los metadatos y mapeos', duration: 15000 }
    ]
  };

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const dictData = await getDictionaryJsonHeader(objectId, user.email, country);
      setDictionaryJsonHeader(dictData);
      
      if (dictData?.id_dictionary_json_header) {
        const details = await getDictionaryJsonDetailsByHeaderId(dictData.id_dictionary_json_header, user.email, country);
        setDictionaryJsonDetails(details);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [objectId, user?.email, country]);

  const fetchPreDictionary = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const data = await getPreDictionaryInputByObjectId(objectId, user.email, country);
      setPreDictionary(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [objectId, user?.email, country]);

  const fetchDictionaryOutput = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getIngestaOutputByObjectId(objectId, user.email, country);
      setIngestaOutput(data);
    } catch (error) {
      console.error('Error fetching ingesta output:', error);
    }
  }, [objectId, user?.email, country]);

  useEffect(() => {
    fetchData();
    fetchPreDictionary();
    fetchDictionaryOutput();
  }, [fetchData, fetchPreDictionary, fetchDictionaryOutput]);

  const handleCloseForm = useCallback(() => {
    setActiveForm(null);
    fetchPreDictionary();
  }, [fetchPreDictionary]);

  const handleOpenForm = (formId: string) => {
    setActiveForm(formId);
  };

  const handleSampleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSampleFile(file);
      }
    };
    input.click();
  };

  const handleDictionaryFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const content = await file.text();
          setDictionaryFileContent(content);
          setDictionaryFile(file);
        } catch (error) {
          console.error('Error al leer el archivo:', error);
        }
      }
    };
    input.click();
  };

  const cleanDataForDownload = (header: DictionaryJsonHeaderResponse, details: DictionaryJsonDetailResponse[]) => {
    const fieldsToRemove = [
      'id_dictionary_json_header',
      'id_object',
      'creation_date',
      'creation_user',
      'update_date',
      'update_user',
      'id_dictionary_json_detail'
    ];

    const cleanHeader = Object.fromEntries(
      Object.entries(header).filter(([key]) => !fieldsToRemove.includes(key))
    );

    const cleanDetails = details.map(detail => 
      Object.fromEntries(
        Object.entries(detail).filter(([key]) => !fieldsToRemove.includes(key))
      )
    );

    return {
      header: cleanHeader,
      details: cleanDetails
    };
  };

  const handleDownload = () => {
    if (!dictionaryJsonHeader || !dictionaryJsonDetails.length) return;

    const cleanData = cleanDataForDownload(dictionaryJsonHeader, dictionaryJsonDetails);
    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictionary_${dictionaryJsonHeader.id_dictionary_json_header}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateDictionaryJson = async () => {
    if (!sampleFile || !user?.email) {
      console.log('Validation failed:', { sampleFile, userEmail: user?.email });
      return;
    }

    setShowSampleProgress(true);
    
    // Calcular duración total de los pasos
    const totalDuration = stepsConfig.sample.reduce((acc, step) => acc + step.duration, 0);

    try {
      // Ejecutar el proceso en paralelo con el progress
      const processPromise = generateDictionaryJson({
        header: {
          id_object: objectId
        },
        details: []
      }, user.email, country);

      // Esperar a que ambos terminen
      await Promise.all([
        processPromise,
        new Promise(resolve => setTimeout(resolve, totalDuration))
      ]);

      await fetchData();
    } catch (error) {
      console.error('Error al generar diccionario JSON:', error);
      throw error;
    } finally {
      setShowSampleProgress(false);
    }
  };

  const calculateProgress = useCallback((data: unknown | null): string => {
    if (!data || typeof data !== 'object') {
      return '0/12';
    }
    
    const fields = Object.entries(data as Record<string, unknown>).filter(([key]) => 
      !['id_pre_dictionary_input', 'id_object', 'creation_date', 'creation_user', 'update_date', 'update_user', 'owner_country'].includes(key)
    );
    const totalFields = fields.length;
    const filledFields = fields.filter(([, value]) => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return `${filledFields}/${totalFields}`;
  }, []);

  const handleDictionaryGeneration = async () => {
    if (!user?.email) return;
    
    setShowDictionaryProgress(true);
    const totalDuration = stepsConfig.dictionary.reduce((acc, step) => acc + step.duration, 0);

    try {
      let headerToUse: CreateDictionaryJsonHeader | null = null;
      let detailsToUse: CreateDictionaryJsonDetail[] = [];

      if (dictionaryJsonHeader) {
        headerToUse = {
          id_object: objectId,
          country: dictionaryJsonHeader.country,
          origin: dictionaryJsonHeader.origin,
          app_product: dictionaryJsonHeader.app_product,
          name_origin: dictionaryJsonHeader.name_origin,
          table_content_origin: dictionaryJsonHeader.table_content_origin,
          primary_keys_table: dictionaryJsonHeader.primary_keys_table,
          table_name_datio: dictionaryJsonHeader.table_name_datio,
          primary_keys_datio: dictionaryJsonHeader.primary_keys_datio,
          table_raw_name: dictionaryJsonHeader.table_raw_name,
          table_master_name: dictionaryJsonHeader.table_master_name,
          information_group_level_2: dictionaryJsonHeader.information_group_level_2,
          partition_fields_raw: dictionaryJsonHeader.partition_fields_raw,
          aggregate_fields_raw: dictionaryJsonHeader.aggregate_fields_raw,
          path_input_raw: dictionaryJsonHeader.path_input_raw,
          path_output_raw: dictionaryJsonHeader.path_output_raw,
          path_input_master: dictionaryJsonHeader.path_input_master,
          path_output_master: dictionaryJsonHeader.path_output_master,
          partition_fields_master: dictionaryJsonHeader.partition_fields_master,
          aggregate_fields_master: dictionaryJsonHeader.aggregate_fields_master,
          number_records_period_intake: dictionaryJsonHeader.number_records_period_intake
        };
        
        detailsToUse = dictionaryJsonDetails.map(detail => ({
          name_field: detail.name_field,
          logical_format: detail.logical_format,
          date_format: detail.date_format,
          calculated: detail.calculated,
          key_origin: detail.key_origin,
          key_datio: detail.key_datio,
          description: detail.description,
          observation: detail.observation,
          required: detail.required
        }));
      }

      if (dictionaryFile && dictionaryFileContent) {
        const jsonData = JSON.parse(dictionaryFileContent) as FileDictionaryJsonHeader;
        
        // Validar que existan todos los campos requeridos del header
        const requiredHeaderFields = [
          'pais', 'origen', 'aplicativo_producto', 'nombre_origen', 
          'descripción_contenido_tabla_origen', 'claves_primarias_tabla',
          'nombre_tabla_en_datio', 'claves_primarias_datio', 'tabla_en_raw',
          'tabla_en_master', 'information_group_level_2', 'campos_particion_raw',
          'campos_agregar_raw', 'path_input_raw', 'path_output_raw',
          'path_input_master', 'path_output_master', 'campos_particion_master',
          'campos_agregar_master', 'Cant_Registros_periodo_ingesta', 'campos'
        ];

        const missingFields = requiredHeaderFields.filter(
          field => jsonData[field as keyof FileDictionaryJsonHeader] === undefined
        );

        if (missingFields.length > 0) {
          console.error(`El archivo JSON no tiene todos los campos requeridos. Campos faltantes: ${missingFields.join(', ')}`);
          return;
        }

        // Validar que cada campo en el detalle tenga todos los atributos requeridos
        const requiredDetailFields = [
          'nombre_campo', 'logical_format', 'formato_fecha', 'calculado',
          'clave_origen', 'clave_datio', 'descripcion', 'observacion', 'obligatorio'
        ];

        for (const campo of jsonData.campos) {
          const missingDetailFields = requiredDetailFields.filter(
            field => !(field in campo)
          );

          if (missingDetailFields.length > 0) {
            console.error(`Campo ${campo.nombre_campo || 'desconocido'} no tiene todos los atributos requeridos. Faltantes: ${missingDetailFields.join(', ')}`);
            return;
          }
        }

        headerToUse = {
          id_object: objectId,
          country: jsonData.pais,
          origin: jsonData.origen,
          app_product: jsonData.aplicativo_producto,
          name_origin: jsonData.nombre_origen,
          table_content_origin: jsonData.descripción_contenido_tabla_origen,
          primary_keys_table: jsonData.claves_primarias_tabla,
          table_name_datio: jsonData.nombre_tabla_en_datio,
          primary_keys_datio: jsonData.claves_primarias_datio,
          table_raw_name: jsonData.tabla_en_raw,
          table_master_name: jsonData.tabla_en_master,
          information_group_level_2: jsonData.information_group_level_2,
          partition_fields_raw: jsonData.campos_particion_raw,
          aggregate_fields_raw: jsonData.campos_agregar_raw,
          path_input_raw: jsonData.path_input_raw,
          path_output_raw: jsonData.path_output_raw,
          path_input_master: jsonData.path_input_master,
          path_output_master: jsonData.path_output_master,
          partition_fields_master: jsonData.campos_particion_master,
          aggregate_fields_master: jsonData.campos_agregar_master,
          number_records_period_intake: jsonData.Cant_Registros_periodo_ingesta
        } as CreateDictionaryJsonHeader;

        detailsToUse = jsonData.campos.map(campo => ({
          name_field: campo.nombre_campo,
          logical_format: campo.logical_format,
          date_format: campo.formato_fecha,
          calculated: campo.calculado,
          key_origin: campo.clave_origen,
          key_datio: campo.clave_datio,
          description: campo.descripcion,
          observation: campo.observacion,
          required: campo.obligatorio === 'true'
        })) as CreateDictionaryJsonDetail[];
      }

      if (!headerToUse || !detailsToUse.length) {
        throw new Error('No hay datos de diccionario disponibles');
      }

      // Ejecutar el proceso en paralelo con el progress
      const processPromise = generateDictionaryBase({
        header: headerToUse,
        details: detailsToUse
      }, user.email, country);

      const timerPromise = new Promise(resolve => setTimeout(resolve, totalDuration));

      // Esperar al proceso más largo
      await Promise.all([
        processPromise,
        timerPromise
      ]).then(() => processPromise);
      
      await fetchDictionaryOutput();
    } catch (error) {
      console.error('Error al generar diccionario base:', error);
    } finally {
      setShowDictionaryProgress(false);
    }
  };

  const getControls = (stepId: string) => {
    switch (stepId) {
      case 'sample':
        return (
          <BoxFlowControls
            centerContent={
              <button
                onClick={() => handleOpenForm('pre-dictionary')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {calculateProgress(preDictionary)}
              </button>
            }
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: async () => {
                setShowSampleProgress(true);
                try {
                  await handleGenerateDictionaryJson();
                } catch (error) {
                  console.error('Error:', error);
                } finally {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setShowSampleProgress(false);
                }
              },
              className: "text-blue-600 hover:text-blue-800",
              disabled: !sampleFile,
              tooltip: !sampleFile ? 'Debe cargar un archivo primero' : undefined
            }]}
            rightIcons={[{
              icon: <ArrowDownTrayIcon className="h-5 w-5" />,
              onClick: handleDownload,
              className: "text-blue-600 hover:text-blue-800",
              disabled: !dictionaryJsonHeader,
              tooltip: !dictionaryJsonHeader ? 'No hay JSON disponible' : undefined
            }]}
          />
        );
      case 'dictionary':
        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: handleDictionaryGeneration,
              className: "text-blue-600 hover:text-blue-800",
              disabled: !dictionaryJsonHeader && !dictionaryFile,
              tooltip: !dictionaryJsonHeader && !dictionaryFile ? 'Se requiere un diccionario o archivo JSON' : undefined
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => setIsLinksPopupOpen(true),
              className: "text-blue-600 hover:text-blue-800",
              disabled: !ingestaOutput,
              tooltip: !ingestaOutput ? 'No hay links disponibles' : undefined
            }]}
          />
        );
      default:
        return null;
    }
  };

  const dictionaryLinks = [
    { label: "Raw Object", url: ingestaOutput?.dictionary_raw_header_link || '' },
    { label: "Raw Fields", url: ingestaOutput?.dictionary_raw_details_link || '' },
    { label: "Master Object", url: ingestaOutput?.dictionary_master_header_link || '' },
    { label: "Master Fields", url: ingestaOutput?.dictionary_master_details_link || '' }
  ];

  if (loading) return null;

  return (
    <>
      <div className="relative p-8">
        <div className="grid grid-cols-4 gap-x-12 gap-y-8">
          {flowStepsConfig.map((step, index) => (
            <div key={step.id} className="relative col-span-1 row-span-1" style={{
              gridColumn: gridLayout[index].x + 1,
              gridRow: gridLayout[index].y + 1,
            }}>
              <BoxFlowCard
                title={step.title}
                isStatic={false}
                schema={step.schema}
                selectedFile={
                  step.id === 'sample' 
                    ? sampleFile 
                    : dictionaryFile
                }
                onFileClick={
                  step.id === 'sample' 
                    ? handleSampleFileSelect 
                    : handleDictionaryFileSelect
                }
                className="w-full border border-gray-400"
                controls={getControls(step.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <PreDictionaryInputForm
        isOpen={activeForm === 'pre-dictionary'}
        onClose={handleCloseForm}
        objectId={objectId}
        initialData={preDictionary || undefined}
      />

      <PopupLinks
        isOpen={isLinksPopupOpen}
        onClose={() => setIsLinksPopupOpen(false)}
        links={dictionaryLinks}
      />

      {showSampleProgress && (
        <ProgressDialog
          title="Procesando Muestra"
          steps={stepsConfig.sample}
          onComplete={() => {}}
        />
      )}
      
      {showDictionaryProgress && (
        <ProgressDialog
          title="Generando Diccionario"
          steps={stepsConfig.dictionary}
          onComplete={() => {}}
        />
      )}
    </>
  );
}; 