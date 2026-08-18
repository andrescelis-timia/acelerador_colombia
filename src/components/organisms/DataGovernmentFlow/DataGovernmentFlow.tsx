import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PopupLinks } from '@/components/molecules/PopupLinks';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { PreDictionaryInputForm } from '@/components/organisms/PreDictionaryInputForm';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { DataGovernmentFlowProps, FileDictionaryJsonHeader } from './types';
import { getCountryConfig } from './config';
import { getDictionaryJsonHeader } from '@/services/DictionaryJsonHeader';
import { CreateDictionaryJsonHeader, DictionaryJsonHeaderResponse } from '@/services/DictionaryJsonHeader/types';
import { getDictionaryJsonDetailsByHeaderId } from '@/services/DictionaryJsonDetail';
import { CreateDictionaryJsonDetail, DictionaryJsonDetailResponse } from '@/services/DictionaryJsonDetail/types';
import { getPreDictionaryInputByObjectId } from '@/services/PreDictionaryInput';
import { PreDictionaryInputResponse, CreatePreDictionaryInput } from '@/services/PreDictionaryInput/types';
import { PlayIcon, ArrowDownTrayIcon, EyeIcon, AdjustmentsHorizontalIcon, XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { generateDictionaryJson, generateDictionaryBase, generateDictionaryL1T, generateDictionaryLiteCo, pollGenerationJob, getLatestGenerationJob } from '@/services/DictionaryGenerator';
import type { GenerateDictionaryLiteCoResponse as LiteCoResult } from '@/services/DictionaryGenerator/types';
import { GenerationBanner } from '@/components/molecules/GenerationBanner';
import { DictionaryStrategiesPanel } from '@/components/molecules/DictionaryStrategiesPanel';
import { useAuth } from '@/lib/context/AuthContext';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';
import { getById } from '@/services/Object';
import { ObjectUpdateWithId } from '@/services/Object/types';

export const DataGovernmentFlow = ({ objectId, country }: DataGovernmentFlowProps) => {
  const { user } = useAuth();

  // Estados principales - DEBEN estar antes de cualquier return
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
  // Job de la generacion en curso y segundos transcurridos, para que el
  // usuario vea que sigue viva durante los minutos que tarda.

  // Si el usuario recarga durante una generacion, se vuelve a enganchar al job
  // en curso. Sin esto el proceso seguiria vivo en el servidor pero la pantalla
  // no mostraria nada: era justo lo que pasaba antes.
  useEffect(() => {
    if (!objectId || !user?.email) return;
    let cancelado = false;
    const email = user.email;

    const retomar = async (
      jobType: 'dictionary_base' | 'dictionary_lite_co',
      onStart: () => void,
      onDone: (result: unknown) => void | Promise<void>,
      onEnd: () => void,
    ) => {
      try {
        const job = await getLatestGenerationJob(objectId, jobType, email, country);
        if (cancelado || !job || job.status !== 'running') return;

        onStart();
        const final = await pollGenerationJob(job.job_id, email, country);
        if (cancelado) return;

        if (final.status === 'failed') {
          setErrorMessage(final.error || 'La generacion del diccionario fallo');
        } else {
          await onDone(final.result);
        }
      } catch {
        // Sin job previo o fallo al consultar: no hay nada que retomar.
      } finally {
        if (!cancelado) onEnd();
      }
    };

    retomar(
      'dictionary_base',
      () => setShowDictionaryProgress(true),
      () => fetchDictionaryOutput(),
      () => setShowDictionaryProgress(false),
    );

    retomar(
      'dictionary_lite_co',
      () => setIsLiteLoading(true),
      (result) => applyLiteResult(result as LiteCoResult | null | undefined),
      () => setIsLiteLoading(false),
    );

    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectId, user?.email, country]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [popupLinksTitle, setPopupLinksTitle] = useState<string>('');
  const [showL1TProgress, setShowL1TProgress] = useState(false);
  const [objectData, setObjectData] = useState<ObjectUpdateWithId | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preDictionaryDraft, setPreDictionaryDraft] = useState<CreatePreDictionaryInput | null>(null);
  const [dictionaryFile, setDictionaryFile] = useState<File | null>(null);
  const [dictionaryFileContent, setDictionaryFileContent] = useState<string | null>(null);
  // Estado para el modo de generación de diccionario (solo visible para Colombia)
  const [dictionaryMode, setDictionaryMode] = useState<'full' | 'lite_co'>(
    country === 'CO' ? 'lite_co' : 'full'
  );
  // Estado para loading del modo lite
  const [isLiteLoading, setIsLiteLoading] = useState(false);
  // Estado para guardar URL del sheet generado en modo lite
  const [liteSheetUrl, setLiteSheetUrl] = useState<string | null>(null);
  // Modal para regenerar filas puntuales (modo update)
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  // Lista de nombres legacy a regenerar (una entrada por linea o separadas por coma)
  const [liteLegacyNamesText, setLiteLegacyNamesText] = useState<string>('');

  // TODOS los hooks deben estar aquí antes de cualquier return
  const fetchDictionaryOutput = useCallback(async () => {
    const config = getCountryConfig(country);
    if (!user?.email || !config.useIngestaOutput) return;
    try {
      const data = await getIngestaOutputByObjectId(objectId, user.email, country);
      setIngestaOutput(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cargar la salida del diccionario');
    }
  }, [objectId, user?.email, country]);

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
    const config = getCountryConfig(country);
    if (!user?.email || !config.usePreDictionary) return;
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

  // Inicializar liteSheetUrl desde objectData cuando se carga
  useEffect(() => {
    if (objectData?.url_document) {
      setLiteSheetUrl(objectData.url_document as string);
    }
  }, [objectData?.url_document]);

  // Handlers
  const handleCloseForm = useCallback((success?: boolean) => {
    if (success) {
      setSuccessMessage('Datos adicionales guardados correctamente');
      setPreDictionaryDraft(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setActiveForm(null);
    fetchPreDictionary();
  }, [fetchPreDictionary]);

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

  // Validar país después de todos los hooks
  if (!country || (country !== 'CO' && country !== 'PE')) {
    return (
      <div className="bg-danger-subtle border border-danger-border rounded-md p-4">
        <p className="text-sm text-danger">
          País no soportado: &quot;{country || '(vacío)'}&quot;
        </p>
        <p className="text-xs text-danger mt-1">
          Solo se soportan los países CO (Colombia) y PE (Perú).
        </p>
      </div>
    );
  }

  const config = getCountryConfig(country);

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

  // Función para limpiar datos para descarga
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
      obligatorio: detail.required ? 'true' : 'false',
      tipo_dato: detail.data_type || '',
      catalogo: detail.catalog || ''
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



  // Detectar delimitador del archivo
  const detectDelimiter = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const firstLine = content.split('\n')[0];

        const commonDelimiters = ['|', ',', ';', '\t'];
        const delimiterCounts = commonDelimiters.map(d => ({
          delimiter: d,
          count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
        }));

        const mostUsedDelimiter = delimiterCounts
          .filter(d => d.count > 0)
          .sort((a, b) => b.count - a.count)[0];

        if (mostUsedDelimiter) {
          resolve(mostUsedDelimiter.delimiter);
        } else {
          // Fallback a coma
          resolve(',');
        }
      };
      reader.readAsText(file);
    });
  };

  const handleGenerateDictionaryJson = async () => {
    if (!sampleFile || !user?.email) {
      setErrorMessage('Se requiere un archivo de muestra y un usuario autenticado');
      return;
    }

    setShowSampleProgress(true);

    try {
      const fileExtension = sampleFile.name.split('.').pop() || '';
      const delimiter = await detectDelimiter(sampleFile);

      const requestData = {
        id_object: objectId,
        sample_file_extension: fileExtension,
        sample_file_delimiter: delimiter
      };

      await generateDictionaryJson(requestData, user.email, country);

      setTimeout(() => {
        setShowSampleProgress(false);
        setSuccessMessage('Diccionario JSON generado correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData();
      }, config.stepsConfig.sample.reduce((acc, step) => acc + step.duration, 0));

    } catch (error) {
      setShowSampleProgress(false);
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar el diccionario JSON');
    }
  };

  // Función para generar diccionario base con validación completa
  const handleDictionaryGeneration = async () => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }

    setShowDictionaryProgress(true);

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
          required: detail.required,
          data_type: detail.data_type,
          catalog: detail.catalog
        }));
      }

      if (dictionaryFile && dictionaryFileContent) {
        const jsonData = JSON.parse(dictionaryFileContent) as FileDictionaryJsonHeader;

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
          required: campo.obligatorio === 'true',
          data_type: campo.tipo_dato,
          catalog: campo.catalogo
        })) as CreateDictionaryJsonDetail[];
      }

      if (!headerToUse || !detailsToUse.length) {
        setErrorMessage('No hay datos de diccionario disponibles');
        return;
      }

      // El POST ya no espera a que termine: devuelve un job_id de inmediato y
      // el resultado se sigue por polling. Antes, en tablas grandes (~5 min)
      // CloudFront cortaba a los 60s y la respuesta se perdia aunque el
      // diccionario quedara guardado.
      const accepted = await generateDictionaryBase({
        header: headerToUse,
        details: detailsToUse
      }, user.email, country);

      const job = await pollGenerationJob(accepted.job_id, user.email, country);

      if (job.status === 'failed') {
        // Ahora llega el error real del backend, no un "Failed to fetch".
        throw new Error(job.error || 'La generacion del diccionario fallo');
      }

      await fetchDictionaryOutput();

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al generar diccionario');
    } finally {
      setShowDictionaryProgress(false);
    }
  };

  const handleGenerateL1T = async () => {
    if (!objectData?.flag_l1t || !user?.email) {
      setErrorMessage('El objeto no tiene habilitado L1T o falta autenticación');
      return;
    }

    setShowL1TProgress(true);

    try {
      const requestData = { id_object: objectId };
      const response = await generateDictionaryL1T(requestData, user.email, country);

      setTimeout(() => {
        setShowL1TProgress(false);

        const links = [
          { label: 'Dictionary L1T Master Header', url: response.dictionary_l1t_master_header_link },
          { label: 'Dictionary L1T Master Detail', url: response.dictionary_l1t_master_detail_link }
        ].filter(link => link.url);

        setSelectedLinks(links);
        setPopupLinksTitle('Enlaces de Diccionario L1T Generado');
        setIsLinksPopupOpen(true);

        setSuccessMessage('Diccionario L1T generado correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);

        if (config.useIngestaOutput) {
          fetchDictionaryOutput();
        }
      }, config.stepsConfig.l1t.reduce((acc, step) => acc + step.duration, 0));

    } catch (error) {
      setShowL1TProgress(false);
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar el diccionario L1T');
    }
  };

  // Función para obtener controles de cada paso
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
          return config.processLabels.sample;
        };

        return (
          <BoxFlowControls
            centerContent={
              <button
                onClick={() => handleOpenForm('pre-dictionary')}
                className="text-sm text-timia-accent hover:text-blue-800"
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
              className: "text-success-icon hover:text-success",
              disabled: !canExecuteSample,
              tooltip: getPreDictionaryTooltip(),
              readOnlyWrapper: true
            }]}
            rightIcons={[{
              icon: <ArrowDownTrayIcon className="h-5 w-5" />,
              onClick: handleDownload,
              className: "text-gray-500 hover:text-timia-accent",
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
              className: "text-success-icon hover:text-success",
              disabled: showDictionaryProgress || (!dictionaryJsonHeader && !dictionaryFile),
              tooltip: showDictionaryProgress
                ? 'Generando… puedes cerrar la pestaña'
                : !dictionaryJsonHeader && !dictionaryFile ?
                'Se requiere un diccionario o archivo JSON' :
                config.processLabels.dictionary,
              readOnlyWrapper: true
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
              className: "text-gray-500 hover:text-timia-accent",
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

        const isL1TDisabled = objectData?.flag_l1t === false;

        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: handleGenerateL1T,
              className: "text-success-icon hover:text-success",
              disabled: isL1TDisabled || !canExecuteL1T,
              tooltip: isL1TDisabled ? 'L1T no habilitado para este objeto' :
                !canExecuteL1T ? 'Se requieren los links del diccionario master' :
                  config.processLabels.l1t,
              readOnlyWrapper: true
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
              className: "text-gray-500 hover:text-timia-accent",
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

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  // Handler para modo lite - solo espera respuesta del backend
  // Convierte la periodicidad del objeto al vocabulario que espera el AI
  const getAiPeriodicity = (): 'daily' | 'weekly' | 'monthly' | 'yearly' => {
    const objectPeriodicity = (objectData?.periodicity ?? 'monthly') as 'daily' | 'weekly' | 'monthly' | 'annual';
    return objectPeriodicity === 'annual' ? 'yearly' : objectPeriodicity;
  };

  // Parsea el textarea de legacy en una lista normalizada (split por coma o salto, trim, sin vacios)
  const parseLegacyNames = (raw: string): string[] =>
    raw.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);

  // Cantidad de legacy actualmente configurados (determina si el Play dispara new o update)
  const liteLegacyNames = parseLegacyNames(liteLegacyNamesText);
  const liteLegacyCount = liteLegacyNames.length;
  const isUpdateMode = liteLegacyCount > 0;

  const handleGenerateLiteCo = async () => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }

    setIsLiteLoading(true);

    try {
      // Responde de inmediato con un job_id; el resultado se sigue por polling.
      const accepted = await generateDictionaryLiteCo({
        object_id: objectId,
        periodicity: getAiPeriodicity(),
        operation_mode: isUpdateMode ? 'update' : 'new',
        ...(isUpdateMode ? { target_legacy_names: liteLegacyNames } : {})
      }, user.email, country);

      const job = await pollGenerationJob(accepted.job_id, user.email, country);

      if (job.status === 'failed') {
        throw new Error(job.error || 'La generacion del diccionario fallo');
      }

      applyLiteResult(job.result as LiteCoResult | null | undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar diccionario');
    } finally {
      setIsLiteLoading(false);
    }
  };

  /** Aplica el payload de un job Lite CO ya terminado (recien hecho o retomado). */
  const applyLiteResult = (result: LiteCoResult | null | undefined) => {
    if (result?.data?.sheet_url) {
      setLiteSheetUrl(result.data.sheet_url);
    }
    if (isUpdateMode) {
      const rows = result?.data?.rows_updated ?? liteLegacyCount;
      setSuccessMessage(`Diccionario actualizado (${rows} ${rows === 1 ? 'fila' : 'filas'})`);
    } else {
      setSuccessMessage('Diccionario generado correctamente');
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Guarda los legacy del modal y cierra. No dispara generacion: eso lo hace el Play.
  const handleSaveLegacyNames = () => {
    setIsLegacyModalOpen(false);
  };

  const handleClearLegacyNames = () => {
    setLiteLegacyNamesText('');
  };

  // Handler para ver el sheet generado en modo lite
  const handleViewLiteSheet = () => {
    if (liteSheetUrl) {
      window.open(liteSheetUrl, '_blank');
    }
  };

  // Cualquiera de los dos flujos en curso muestra la misma banda: al usuario le
  // da igual cual endpoint corre por debajo.
  const generacionEnCurso = showDictionaryProgress || isLiteLoading;

  // Modo lite: una sola tarjeta con cabecera propia. El modo completo es un
  // diagrama de varios pasos y respira mas, por eso conserva su padding de 8.
  const esModoLite = country === 'CO' && dictionaryMode === 'lite_co';
  const paddingSeccion = esModoLite ? 'px-5' : 'px-8';

  return (
    <>
      {/* Tarjeta contenedora. Igual que Pipeline Generator, Control-M y
          Despliegues ADA: esta seccion era la unica sin fondo propio y se
          veia hundida contra el gris de la pagina. El padding lo siguen
          poniendo las secciones de dentro, por eso el envoltorio no lleva. */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Cabecera al estilo de Control-M y Despliegues ADA. Solo en modo lite:
            el modo completo es un diagrama de varios pasos y cada tarjeta lleva
            ya su propia etiqueta, asi que un titulo unico arriba sobraria. */}
        {esModoLite && (
          <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3">
            <BookOpenIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-medium text-gray-900">Generar Diccionario</h3>
          </div>
        )}

        {generacionEnCurso && (
          <div className={`${paddingSeccion} pt-4`}>
            <GenerationBanner />
          </div>
        )}

        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
            {successMessage}
          </div>
        )}

        {/* Selector de modo - Solo visible para Colombia - AL INICIO
            Oculto temporalmente a peticion del equipo. El modo sigue vivo en
            `dictionaryMode`, asi que basta con volver a poner la condicion para
            recuperarlo. */}
        {false && country === 'CO' && (
          <div className="px-8 pt-2">
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDictionaryMode('lite_co')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  dictionaryMode === 'lite_co'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Formato Nebula
              </button>
              <button
                onClick={() => setDictionaryMode('full')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  dictionaryMode === 'full'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Formato DATUM
              </button>
            </div>
          </div>
        )}

        {/* Modo Lite: UI simplificada - Mismo formato que DATUM */}
        {esModoLite ? (
          <div className="relative p-5">
            <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start">
              {/* Card principal - Formato BoxFlowCard */}
              {/* Sin etiqueta encima: el titulo esta ahora en la cabecera de la
                  tarjeta. Aqui solo queda una unica caja, asi que nombrarla
                  seria repetir lo que ya dice la cabecera. */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-[200px] h-[150px] flex-shrink-0 rounded-lg border-2 border-gray-200">
                  <div className="h-full rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-gray-200 p-2 bg-white h-[40px] flex items-center">
                      <BoxFlowControls
                        leftIcons={[
                          {
                            // Sin spinner aqui: la banda superior ya indica que
                            // hay una generacion en curso. El boton solo se
                            // deshabilita, para no encolar dos veces lo mismo.
                            icon: <PlayIcon className="h-5 w-5" />,
                            onClick: handleGenerateLiteCo,
                            className: "text-success-icon hover:text-success",
                            disabled: isLiteLoading,
                            tooltip: isLiteLoading
                              ? 'Generando… puedes cerrar la pestaña'
                              : isUpdateMode
                                ? `Regenerar ${liteLegacyCount} ${liteLegacyCount === 1 ? 'campo' : 'campos'}`
                                : 'Generar diccionario',
                            readOnlyWrapper: true
                          },
                          {
                            icon: (
                              <span className="relative inline-flex">
                                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                {isUpdateMode && (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[10px] font-bold leading-none text-white bg-blue-500 rounded-full">
                                    {liteLegacyCount}
                                  </span>
                                )}
                              </span>
                            ),
                            onClick: () => setIsLegacyModalOpen(true),
                            className: isUpdateMode
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-gray-500 hover:text-blue-600",
                            disabled: isLiteLoading,
                            tooltip: isUpdateMode
                              ? `Configurar campos a regenerar (${liteLegacyCount} guardados)…`
                              : 'Configurar campos a regenerar…',
                            readOnlyWrapper: true
                          }
                        ]}
                        rightIcons={[{
                          icon: <EyeIcon className="h-5 w-5" />,
                          onClick: handleViewLiteSheet,
                          className: "text-gray-500 hover:text-timia-accent",
                          disabled: !liteSheetUrl,
                          tooltip: !liteSheetUrl ? 'Genera el diccionario primero' : 'Ver en Google Sheets'
                        }]}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DictionaryStrategiesPanel />
            </div>
          </div>
        ) : (
          /* Modo Completo: UI original con L1T */
          <div className="relative p-8">
            <div className="flex items-center gap-12">
              {/* Líneas de conexión */}
              <div
                className="absolute h-[2px] bg-[#94B5F0]"
                style={{
                  top: 'calc(50% + 12px)',
                  transform: 'translateY(-50%)',
                  left: '232px',
                  width: '48px',
                  zIndex: 0
                }}
              />
              <div
                className="absolute h-[2px] bg-[#94B5F0]"
                style={{
                  top: 'calc(50% + 12px)',
                  transform: 'translateY(-50%)',
                  left: '480px',
                  width: '48px',
                  zIndex: 0
                }}
              />

              {/* BoxFlowCard Muestra */}
              <div className="relative z-10">
                <div className="text-center mb-3">
                  <div className="inline-block bg-gray-50 border border-info-border rounded-lg px-3 py-1.5">
                    <h3 className="text-sm font-semibold text-gray-800">Procesar Pre-diccionario</h3>
                  </div>
                </div>
                <BoxFlowCard
                  title="Muestra"
                  isStatic={false}
                  schema="txt, csv"
                  selectedFile={sampleFile}
                  onFileClick={handleSampleFileSelect}
                  className="border-2 border-gray-200"
                  controls={getControls('sample')}
                />
              </div>

              {/* BoxFlowCard Diccionario */}
              <div className="relative z-10">
                <div className="text-center mb-3">
                  <div className="inline-block bg-gray-50 border border-info-border rounded-lg px-3 py-1.5">
                    <h3 className="text-sm font-semibold text-gray-800">Generar Diccionarios</h3>
                  </div>
                </div>
                <BoxFlowCard
                  title="Pre-diccionario"
                  isStatic={false}
                  schema="json"
                  selectedFile={dictionaryFile}
                  onFileClick={handleDictionaryFileSelect}
                  className="border-2 border-gray-200"
                  controls={getControls('dictionary')}
                />
              </div>

              {/* BoxFlowCard L1T */}
              <div className="relative z-10">
                <div className="text-center mb-3">
                  <div className="inline-block bg-gray-50 border border-info-border rounded-lg px-3 py-1.5">
                    <h3 className="text-sm font-semibold text-gray-800">Generar L1T</h3>
                  </div>
                </div>
                <BoxFlowCard
                  title="Diccionario L1T"
                  isStatic={true}
                  className="border-2 border-gray-200"
                  controls={getControls('l1t')}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {config.usePreDictionary && (
        <PreDictionaryInputForm
          isOpen={activeForm === 'pre-dictionary'}
          onClose={handleCloseForm}
          objectId={objectId}
          initialData={preDictionary || undefined}
          draftData={preDictionaryDraft}
          onDraftChange={setPreDictionaryDraft}
        />
      )}

      <PopupLinks
        isOpen={isLinksPopupOpen}
        onClose={() => {
          setIsLinksPopupOpen(false);
          setSelectedLinks([]);
        }}
        links={selectedLinks}
        title={popupLinksTitle}
      />

      {showSampleProgress && (
        <ProgressDialog
          title={config.processLabels.sample}
          steps={config.stepsConfig.sample}
          onComplete={() => { }}
        />
      )}

      {showL1TProgress && (
        <ProgressDialog
          title={config.processLabels.l1t}
          steps={config.stepsConfig.l1t}
          onComplete={() => { }}
        />
      )}

      {/* Modal de configuracion de campos puntuales para regenerar (se dispara con el Play) */}
      {isLegacyModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h3 className="text-base font-semibold text-gray-800">Campos a regenerar</h3>
              <button
                type="button"
                onClick={() => setIsLegacyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <label htmlFor="lite-legacy-names" className="block text-sm font-medium text-gray-700 mb-1">
                Nombres legacy a regenerar
              </label>
              <textarea
                id="lite-legacy-names"
                value={liteLegacyNamesText}
                onChange={(e) => setLiteLegacyNamesText(e.target.value)}
                placeholder={'LEGACY_CAMPO_1\nLEGACY_CAMPO_2'}
                rows={6}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-timia-accent focus:border-transparent"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Uno por linea o separados por coma. Al guardar, el Play regenera solo estos campos. Si la lista esta vacia, el Play regenera todo el diccionario.
              </p>
            </div>
            <div className="flex justify-between items-center gap-2 border-t border-gray-200 px-5 py-3 bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={handleClearLegacyNames}
                disabled={liteLegacyNamesText.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleSaveLegacyNames}
                className="px-4 py-2 text-sm font-medium text-white bg-timia-accent rounded-md hover:opacity-90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ErrorModal
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
};