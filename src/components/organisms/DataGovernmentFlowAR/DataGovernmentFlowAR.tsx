import { useEffect, useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { DataGovernmentFlowProps, FileDictionaryJsonHeader } from './types';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { getDictionaryJsonHeader } from '@/services/DictionaryJsonHeader';
import { getRefinementByObjectId } from '@/services/Refinement';
import { RefinementResponse } from '@/services/Refinement/types';
import { PlayIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { generateDictionaryJson } from '@/services/DictionaryGenerator';
import { useAuth } from '@/lib/context/AuthContext';
import { getDictionaryJsonDetailsByHeaderId } from '@/services/DictionaryJsonDetail';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';
import { generateDictionaryBase } from '@/services/DictionaryGenerator';
import { CreateDictionaryJsonHeader, DictionaryJsonHeaderResponse } from '@/services/DictionaryJsonHeader/types';
import { CreateDictionaryJsonDetail, DictionaryJsonDetailResponse } from '@/services/DictionaryJsonDetail/types';

import { PopupLinks } from '@/components/molecules/PopupLinks';

export const DataGovernmentFlowAR = ({ objectId }: DataGovernmentFlowProps) => {
  const { user, country = 'AR' } = useAuth();
  const [dictionaryJsonHeader, setDictionaryJsonHeader] = useState<DictionaryJsonHeaderResponse | null>(null);
  const [dictionaryJsonDetails, setDictionaryJsonDetails] = useState<DictionaryJsonDetailResponse[]>([]);
  const [refinement, setRefinement] = useState<RefinementResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dictionaryFile, setDictionaryFile] = useState<File | null>(null);
  const [dictionaryFileContent, setDictionaryFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLinksPopupOpen, setIsLinksPopupOpen] = useState(false);
  const [ingestaOutput, setIngestaOutput] = useState<IngestaOutputResponse | null>(null);
  const [showDictionaryProgress, setShowDictionaryProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const stepsConfig = {
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
      const data = await getRefinementByObjectId(objectId, user.email, country);
      setRefinement(data);
      const dictData = await getDictionaryJsonHeader(objectId, user.email, country);
      setDictionaryJsonHeader(dictData);
      
      if (dictData?.id_dictionary_json_header) {
        const details = await getDictionaryJsonDetailsByHeaderId(dictData.id_dictionary_json_header, user.email, country);
        setDictionaryJsonDetails(details);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [objectId, user?.email, country]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = () => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
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
    if (!selectedFile || !user?.email) {
      setErrorMessage(!selectedFile 
        ? 'Debe cargar un archivo primero' 
        : 'Usuario no autenticado');
      return;
    }
    try {
      const fileExtension = selectedFile.name.split('.').pop() || '';
      await generateDictionaryJson({
        id_object: objectId,
        sample_file_extension: fileExtension
      }, user.email, country);
      await fetchData();
      setSuccessMessage('Diccionario JSON generado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar diccionario');
    }
  };

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

      const processPromise = generateDictionaryBase({
        header: headerToUse,
        details: detailsToUse
      }, user.email, country);

      const timerPromise = new Promise(resolve => setTimeout(resolve, totalDuration));

      await Promise.all([
        processPromise,
        timerPromise
      ]).then(() => processPromise);
      
      await fetchDictionaryOutput();
      setSuccessMessage('Diccionario base generado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al generar diccionario');
    } finally {
      setShowDictionaryProgress(false);
    }
  };

  const fetchDictionaryOutput = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getIngestaOutputByObjectId(objectId, user.email, country);
      setIngestaOutput(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar la salida del diccionario');
    }
  }, [objectId, user?.email, country]);

  useEffect(() => {
    fetchDictionaryOutput();
  }, [fetchDictionaryOutput]);

  const dictionaryLinks = [
    { label: "Raw Object", url: ingestaOutput?.dictionary_raw_header_link || '' },
    { label: "Raw Fields", url: ingestaOutput?.dictionary_raw_details_link || '' },
    { label: "Master Object", url: ingestaOutput?.dictionary_master_header_link || '' },
    { label: "Master Fields", url: ingestaOutput?.dictionary_master_details_link || '' }
  ];

  const getControls = (stepId: string) => {
    switch (stepId) {
      case 'teradata':
        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: handleGenerateDictionaryJson,
              className: "text-green-500 hover:text-green-600",
              disabled: !selectedFile || !refinement,
              tooltip: !selectedFile 
                ? 'Debe cargar un archivo primero'
                : !refinement 
                ? 'No hay refinamiento disponible'
                : undefined
            }]}
            rightIcons={[{
              icon: <ArrowDownTrayIcon className="h-5 w-5" />,
              onClick: handleDownload,
              className: "text-blue-500 hover:text-blue-600",
              disabled: !dictionaryJsonHeader || !dictionaryJsonDetails.length,
              tooltip: !dictionaryJsonHeader 
                ? 'No hay diccionario disponible'
                : !dictionaryJsonDetails.length 
                ? 'No hay detalles disponibles'
                : undefined
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
              tooltip: !dictionaryJsonHeader && !dictionaryFile ? 'Se requiere un diccionario o archivo JSON' : undefined
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => setIsLinksPopupOpen(true),
              className: "text-blue-500 hover:text-blue-600",
              disabled: !ingestaOutput,
              tooltip: !ingestaOutput ? 'No hay links disponibles' : undefined
            }]}
          />
        );
      case 'datum':
        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: () => setErrorMessage('Funcionalidad no implementada'),
              className: "text-green-500 hover:text-green-600"
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => setErrorMessage('Funcionalidad no implementada'),
              className: "text-blue-500 hover:text-blue-600"
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
          <div 
            className="absolute h-[2px] bg-[#94B5F0]"
            style={{ 
              top: '50%',
              transform: 'translateY(-50%)',
              left: '480px',
              width: '48px',
              zIndex: 0
            }} 
          />

          {/* BoxFlowCard Teradata */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Teradata"
              isStatic={false}
              schema="xlsx, xml"
              selectedFile={selectedFile}
              onFileClick={handleFileSelect}
              className="border-2 border-[#94B5F0]"
              controls={getControls('teradata')}
            />
          </div>

          {/* BoxFlowCard Diccionario */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Diccionario"
              isStatic={false}
              schema="json"
              selectedFile={dictionaryFile}
              onFileClick={handleDictionaryFileSelect}
              className="border-2 border-[#94B5F0]"
              controls={getControls('dictionary')}
            />
          </div>

          {/* BoxFlowCard Datum */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Datum"
              isStatic={true}
              className="border-2 border-[#94B5F0]"
              controls={getControls('datum')}
            />
          </div>
        </div>
      </div>

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      <PopupLinks
        title="Diccionarios"
        isOpen={isLinksPopupOpen}
        onClose={() => setIsLinksPopupOpen(false)}
        links={dictionaryLinks}
      />

      {showDictionaryProgress && (
        <ProgressDialog
          title="Procesando Diccionario"
          steps={stepsConfig.dictionary}
          onComplete={() => {}}
        />
      )}
    </>
  );
};