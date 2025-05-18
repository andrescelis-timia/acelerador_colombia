import { useEffect, useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PopupLinks } from '@/components/molecules/PopupLinks';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { PreDictionaryInputForm } from '@/components/organisms/PreDictionaryInputForm';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { DataGovernmentFlowProps, FileDictionaryJsonHeader } from './types';
import { getDictionaryJsonHeader } from '@/services/DictionaryJsonHeader';
import { CreateDictionaryJsonHeader, DictionaryJsonHeaderResponse } from '@/services/DictionaryJsonHeader/types';
import { getDictionaryJsonDetailsByHeaderId } from '@/services/DictionaryJsonDetail';
import { CreateDictionaryJsonDetail, DictionaryJsonDetailResponse } from '@/services/DictionaryJsonDetail/types';
import { getPreDictionaryInputByObjectId } from '@/services/PreDictionaryInput';
import { PreDictionaryInputResponse, CreatePreDictionaryInput } from '@/services/PreDictionaryInput/types';
import { PlayIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { generateDictionaryJson, generateDictionaryBase, generateDictionaryL1T } from '@/services/DictionaryGenerator';
import { useAuth } from '@/lib/context/AuthContext';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';
import { getById } from '@/services/Object';
import { ObjectUpdateWithId } from '@/services/Object/types';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [popupLinksTitle, setPopupLinksTitle] = useState<string>('');
  const [showL1TProgress, setShowL1TProgress] = useState(false);
  const [objectData, setObjectData] = useState<ObjectUpdateWithId | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preDictionaryDraft, setPreDictionaryDraft] = useState<CreatePreDictionaryInput | null>(null);

  const stepsConfig = {
    sample: [
      { label: 'Procesando muestra', duration: 500 },
      { label: 'Validando datos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
    ],
    dictionary: [
      { label: 'Inicializando acceso a APIs, bases de datos y almacenamiento en la nube', duration: 16500 },
      { label: 'Cargando archivos de entrada y configuraciones desde la nube', duration: 16500 },
      { label: 'Verificando y aplicando reglas y formatos específicos del país', duration: 16500 },
      { label: 'Creando estructura base del diccionario para tablas raw', duration: 16500 },
      { label: 'Creando estructura base del diccionario para tablas master', duration: 16500 },
      { label: 'Ejecutando IA para analizar y enriquecer metadatos, nombres y descripciones de campos', duration: 16500 },
      { label: 'Aplicando formatos estándar y validaciones a todos los campos', duration: 16500 },
      { label: 'Creando diccionarios de datos detallados y mapeos de campos', duration: 16500 },
      { label: 'Creando y guardando archivos CSV finales con todos los metadatos y mapeos', duration: 18000 }
    ],
    l1t: [
      { label: 'Extrayendo diccionario Master de objects y fields', duration: 10000 },
      { label: 'Procesando datos de L1T', duration: 10000 },
      { label: 'Generando dictionario L1T de objects y fields', duration: 10000 }
    ]
  };

  const PROCESS_TITLES = {
    sample: 'Procesando Muestra',
    dictionary: 'Generando Diccionario',
    l1t: 'Generando Diccionario L1T'
  };

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const dictData = await getDictionaryJsonHeader(objectId, user.email, country);
      setDictionaryJsonHeader(dictData);
      
      if (dictData?.id_dictionary_json_header) {
        const details = await getDictionaryJsonDetailsByHeaderId(dictData.id_dictionary_json_header, user.email, country);
        const sortedDetails = details.sort((a, b) => a.order_row - b.order_row);
        setDictionaryJsonDetails(sortedDetails);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar los datos del diccionario');
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
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar el pre-diccionario');
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
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar la salida del diccionario');
    }
  }, [objectId, user?.email, country]);

  const fetchObjectData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getById(objectId, user.email, country);
      setObjectData(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar datos del objeto');
    }
  }, [objectId, user?.email, country]);

  useEffect(() => {
    fetchData();
    fetchPreDictionary();
    fetchDictionaryOutput();
    fetchObjectData();
  }, [fetchData, fetchPreDictionary, fetchDictionaryOutput, fetchObjectData]);

  const handleCloseForm = useCallback((success?: boolean) => {
    if (success) {
      setSuccessMessage('Datos adicionales guardados correctamente');
      setPreDictionaryDraft(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
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
          setErrorMessage(error instanceof Error ? error.message : 'Error al leer el archivo');
        }
      }
    };
    input.click();
  };

  const cleanDataForDownload = (header: DictionaryJsonHeaderResponse, details: DictionaryJsonDetailResponse[]) => {
    const cleanDetails = details.map(detail => ({
      nombre_campo: detail.name_field,
      logical_format: detail.logical_format,
      formato_fecha: detail.date_format,
      calculado: detail.calculated,
      clave_origen: detail.key_origin,
      clave_datio: detail.key_datio,
      descripcion: detail.description,
      observacion: detail.observation,
      obligatorio: detail.required ? 'true' : 'false'
    }));

    const cleanData: FileDictionaryJsonHeader = {
      pais: header.country,
      origen: header.origin,
      aplicativo_producto: header.app_product,
      nombre_origen: header.name_origin,
      'descripción_contenido_tabla_origen': header.table_content_origin,
      claves_primarias_tabla: header.primary_keys_table,
      nombre_tabla_en_datio: header.table_name_datio,
      claves_primarias_datio: header.primary_keys_datio,
      tabla_en_raw: header.table_raw_name,
      tabla_en_master: header.table_master_name,
      information_group_level_2: header.information_group_level_2,
      campos_particion_raw: header.partition_fields_raw,
      campos_agregar_raw: header.aggregate_fields_raw,
      path_input_raw: header.path_input_raw,
      path_output_raw: header.path_output_raw,
      path_input_master: header.path_input_master,
      path_output_master: header.path_output_master,
      campos_particion_master: header.partition_fields_master,
      campos_agregar_master: header.aggregate_fields_master,
      'Cant_Registros_periodo_ingesta': header.number_records_period_intake,
      campos: cleanDetails
    };

    return cleanData;
  };

  const handleDownload = () => {
    if (!dictionaryJsonHeader || !dictionaryJsonDetails.length) {
      setErrorMessage('No hay datos disponibles para descargar');
      return;
    }

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
      setErrorMessage('Se requiere un archivo de muestra y un usuario autenticado');
      return;
    }

    setShowSampleProgress(true);
    
    try {
      // Obtener la extensión del archivo
      const fileExtension = sampleFile.name.split('.').pop() || '';

      // Extraer el delimitador del archivo
      let delimiter = '';
      try {
        const firstLine = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            const firstLine = content.split('\n')[0];
            resolve(firstLine);
          };
          reader.readAsText(sampleFile);
        });

        // Detectar el delimitador más común entre los candidatos comunes
        const commonDelimiters = ['|', ',', ';', '\t'];
        const delimiterCounts = commonDelimiters.map(d => ({
          delimiter: d,
          count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
        }));

        // Si hay múltiples delimitadores, preferir el que tenga más ocurrencias
        const mostUsedDelimiter = delimiterCounts
          .filter(d => d.count > 0)
          .sort((a, b) => b.count - a.count)[0];

        // Si no se encontró ningún delimitador, intentar detectar espacios múltiples o tabulaciones
        if (!mostUsedDelimiter) {
          // Primero intentar detectar tabulaciones
          const tabMatch = firstLine.match(/\t/g);
          if (tabMatch) {
            delimiter = '\t';
          } else {
            // Si no hay tabulaciones, buscar espacios múltiples
            const multipleSpaces = firstLine.match(/\s{2,}/);
            if (multipleSpaces) {
              delimiter = multipleSpaces[0];
            }
          }
        } else {
          delimiter = mostUsedDelimiter.delimiter;
        }

        // Si aún no se encontró un delimitador, intentar detectar espacios múltiples en toda la línea
        if (!delimiter) {
          const parts = firstLine.split(/\s+/);
          if (parts.length > 1) {
            delimiter = ' ';
          }
        }
      } catch (error) {
        console.error('Error al extraer el delimitador:', error);
        delimiter = '';
      }
      // Mostrar el delimitador de una manera más visible
      console.log('Delimitador detectado:', {
        value: delimiter,
        charCode: delimiter.charCodeAt(0),
        representation: delimiter === '\t' ? 'TAB' : 
                        delimiter === ' ' ? 'SPACE' : 
                        delimiter === ',' ? 'COMMA' : 
                        delimiter === ';' ? 'SEMICOLON' : 
                        delimiter === '|' ? 'PIPE' : 
                        delimiter
      });

      // Convertir el delimitador a un formato seguro para la API
      const apiDelimiter = delimiter === '\t' ? '\\t' : delimiter;

      // Calcular duración total de los pasos
      const totalDuration = stepsConfig.sample.reduce((acc, step) => acc + step.duration, 0);

      // Ejecutar el proceso en paralelo con el progress
      const processPromise = generateDictionaryJson({
        id_object: objectId,
        sample_file_extension: fileExtension,
        sample_file_delimiter: apiDelimiter
      }, user.email, country);

      // Esperar a que ambos terminen
      await Promise.all([
        processPromise,
        new Promise(resolve => setTimeout(resolve, totalDuration))
      ]);

      await fetchData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar diccionario JSON');
    } finally {
      setShowSampleProgress(false);
    }
  };

  const calculateProgress = useCallback((data: unknown | null): string => {
    if (!data || typeof data !== 'object') {
      return '0/9';
    }
    
    // Excluir campos que no deben contarse
    const excludeFields = ['id_pre_dictionary_input', 'id_object', 'creation_date', 'creation_user', 'update_date', 'update_user', 'owner_country'];
    // Si el país es CO, también excluimos los campos de partición y agregación
    if (country === 'CO') {
      excludeFields.push('partition_fields_raw', 'partition_fields_master', 'aggregate_fields_raw', 'aggregate_fields_master');
    }

    const fields = Object.entries(data as Record<string, unknown>).filter(([key]) => 
      !excludeFields.includes(key)
    );
    const totalFields = fields.length;
    const filledFields = fields.filter(([, value]) => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return `${filledFields}/${totalFields}`;
  }, [country]);

  const handleDictionaryGeneration = async () => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    
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
          const errorMsg = `El archivo JSON no tiene todos los campos requeridos. Campos faltantes: ${missingFields.join(', ')}`;
          setErrorMessage(errorMsg);
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
            setErrorMessage(`Campo ${campo.nombre_campo || 'desconocido'} no tiene todos los atributos requeridos. Faltantes: ${missingDetailFields.join(', ')}`);
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
        setErrorMessage('No hay datos de diccionario disponibles');
        return;
      }

      // Reemplazar el error simulado por la llamada real
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
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al generar diccionario');
    } finally {
      setShowDictionaryProgress(false);
    }
  };

  const getControls = (stepId: string) => {
    switch (stepId) {
      case 'sample':
        const progress = calculateProgress(preDictionary);
        const [filled, total] = progress.split('/').map(Number);
        const isPreDictionaryComplete = filled === total;
        const canExecuteSample = sampleFile && isPreDictionaryComplete;
        
        const getPreDictionaryTooltip = () => {
          if (!sampleFile) return 'Debe cargar un archivo primero';
          if (!isPreDictionaryComplete) {
            const remaining = total - filled;
            return `Te faltan llenar ${remaining} campo${remaining === 1 ? '' : 's'} adicional${remaining === 1 ? '' : 'es'}`;
          }
          return PROCESS_TITLES.sample;
        };

        return (
          <BoxFlowControls
            centerContent={
              <button
                onClick={() => handleOpenForm('pre-dictionary')}
                className="text-sm text-blue-600 hover:text-blue-800"
                title="Campos adicionales"
              >
                {progress}
              </button>
            }
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: async () => {
                setShowSampleProgress(true);
                try {
                  await handleGenerateDictionaryJson();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : 'Error al generar diccionario');
                } finally {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setShowSampleProgress(false);
                }
              },
              className: "text-green-500 hover:text-green-600",
              disabled: !canExecuteSample,
              tooltip: getPreDictionaryTooltip()
            }]}
            rightIcons={[{
              icon: <ArrowDownTrayIcon className="h-5 w-5" />,
              onClick: handleDownload,
              className: "text-blue-500 hover:text-blue-600",
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
              className: "text-green-500 hover:text-green-600",
              disabled: !dictionaryJsonHeader && !dictionaryFile,
              tooltip: !dictionaryJsonHeader && !dictionaryFile ? 
                'Se requiere un diccionario o archivo JSON' : 
                PROCESS_TITLES.dictionary
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => {
                setIsLinksPopupOpen(true);
                setSelectedLinks([
                  { label: "Raw Object", url: ingestaOutput?.dictionary_raw_header_link || '' },
                  { label: "Raw Fields", url: ingestaOutput?.dictionary_raw_details_link || '' },
                  { label: "Master Object", url: ingestaOutput?.dictionary_master_header_link || '' },
                  { label: "Master Fields", url: ingestaOutput?.dictionary_master_details_link || '' }
                ]);
                setPopupLinksTitle('Archivos generados para diccionario');
              },
              className: "text-blue-500 hover:text-blue-600",
              disabled: !ingestaOutput,
              tooltip: !ingestaOutput ? 'No hay links disponibles' : undefined
            }]}
          />
        );
      case 'l1t':
        const canExecuteL1T = ingestaOutput !== null && 
          ingestaOutput.dictionary_master_header_link !== null &&
          ingestaOutput.dictionary_master_header_link !== '' && 
          ingestaOutput.dictionary_master_details_link !== null &&
          ingestaOutput.dictionary_master_details_link !== '';

        // El flag_l1t tiene prioridad sobre la lógica existente
        const isL1TDisabled = objectData?.flag_l1t === false;

        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: async () => {
                if (!user?.email) {
                  setErrorMessage('Usuario no autenticado');
                  return;
                }

                setShowL1TProgress(true);
                const totalDuration = stepsConfig.l1t.reduce((acc, step) => acc + step.duration, 0);
                
                try {
                  const processPromise = generateDictionaryL1T({
                    id_object: objectId
                  }, user.email, country);

                  const timerPromise = new Promise(resolve => setTimeout(resolve, totalDuration));

                  // Esperar a que ambos terminen
                  await Promise.all([
                    processPromise,
                    timerPromise
                  ]);

                  await fetchDictionaryOutput();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : 'Error al generar diccionario L1T');
                } finally {
                  setShowL1TProgress(false);
                }
              },
              className: "text-green-500 hover:text-green-600",
              disabled: isL1TDisabled || !canExecuteL1T,
              tooltip: isL1TDisabled ? 'L1T no habilitado para este objeto' : 
                      !canExecuteL1T ? 'Se requieren los links del diccionario master' : 
                      PROCESS_TITLES.l1t
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => {
                setIsLinksPopupOpen(true);
                setSelectedLinks([
                  { label: "L1T Object", url: ingestaOutput?.dictionary_l1t_master_header_link || '' },
                  { label: "L1T Fields", url: ingestaOutput?.dictionary_l1t_master_detail_link || '' }
                ]);
                setPopupLinksTitle('Archivos generados para diccionario L1T');
              },
              className: "text-blue-500 hover:text-blue-600",
              disabled: isL1TDisabled || !ingestaOutput,
              tooltip: isL1TDisabled ? 'L1T no habilitado para este objeto' :
                      !ingestaOutput ? 'No hay links disponibles' : undefined
            }]}
          />
        );
      default:
        return null;
    }
  };

  if (loading) return null;

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}

      <div className="relative p-8">
        <div className="flex items-center gap-12">
          {/* Líneas de conexión */}
          <div 
            className="absolute h-[2px] bg-[#94B5F0]"
            style={{ 
              top: '50%',
              transform: 'translateY(-50%)',
              left: '232px',
              width: '48px',
              zIndex: 0
            }} 
          />

          {/* BoxFlowCard Muestra */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Muestra"
              isStatic={false}
              schema="txt, csv"
              selectedFile={sampleFile}
              onFileClick={handleSampleFileSelect}
              className="border-2 border-[#94B5F0]"
              controls={getControls('sample')}
            />
          </div>

          {/* BoxFlowCard Diccionario */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Pre-diccionario"
              isStatic={false}
              schema="json"
              selectedFile={dictionaryFile}
              onFileClick={handleDictionaryFileSelect}
              className="border-2 border-[#94B5F0]"
              controls={getControls('dictionary')}
            />
          </div>

          {/* Línea de conexión para L1T */}
          <div 
            className={`absolute h-[2px] ${objectData?.flag_l1t === false ? 'bg-gray-300' : 'bg-[#94B5F0]'}`}
            style={{ 
              top: '50%',
              transform: 'translateY(-50%)',
              left: '480px',
              width: '48px',
              zIndex: 0
            }} 
          />

          {/* BoxFlowCard L1T */}
          <div className="relative z-10">
            <BoxFlowCard
              title="L1T"
              isStatic={true}
              className={`border-2 ${objectData?.flag_l1t === false ? 'border-gray-300' : 'border-[#94B5F0]'}`}
              controls={getControls('l1t')}
            />
          </div>
        </div>
      </div>

      <PreDictionaryInputForm
        isOpen={activeForm === 'pre-dictionary'}
        onClose={handleCloseForm}
        objectId={objectId}
        initialData={preDictionary || undefined}
        draftData={preDictionaryDraft}
        onDraftChange={setPreDictionaryDraft}
      />

      <PopupLinks
        isOpen={isLinksPopupOpen}
        onClose={() => {
          setIsLinksPopupOpen(false);
          setSelectedLinks([]); // Limpiar los links seleccionados al cerrar
        }}
        links={selectedLinks}
        title={popupLinksTitle}
      />

      {showSampleProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.sample}
          steps={stepsConfig.sample}
          onComplete={() => {}}
        />
      )}
      
      {showDictionaryProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.dictionary}
          steps={stepsConfig.dictionary}
          onComplete={() => {}}
        />
      )}

      {showL1TProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.l1t}
          steps={stepsConfig.l1t}
          onComplete={() => {}}
        />
      )}

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 