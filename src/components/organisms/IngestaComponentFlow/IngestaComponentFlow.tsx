import { useEffect, useState, useCallback } from 'react';
import { PlayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PopupLinks } from '@/components/molecules/PopupLinks';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { IngestaComponentFlowProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';
import { generateRawFiles, generateMasterFiles, generateL1TMasterFiles } from '@/services/IngestaComponentsGenerator';
import { getById } from '@/services/Object';
import { ObjectUpdateWithId } from '@/services/Object/types';
export const IngestaComponentFlow = ({ objectId }: IngestaComponentFlowProps) => {
  const { user, country } = useAuth();
  const [isLinksPopupOpen, setIsLinksPopupOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showRawProgress, setShowRawProgress] = useState(false);
  const [showMasterProgress, setShowMasterProgress] = useState(false);
  const [showL1TProgress, setShowL1TProgress] = useState(false);
  const [ingestaOutput, setIngestaOutput] = useState<IngestaOutputResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [objectData, setObjectData] = useState<ObjectUpdateWithId | null>(null);

  const PROCESS_TITLES = {
    raw: 'Procesando RAW',
    master: 'Procesando MASTER',
    l1t: 'Procesando L1T'
  };

  const fetchIngestaOutput = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getIngestaOutputByObjectId(objectId, user.email, country);
      setIngestaOutput(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al obtener datos de ingesta');
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
    fetchIngestaOutput();
    fetchObjectData();
  }, [fetchIngestaOutput, fetchObjectData]);

  const rawLinks = [
    { label: "CONF", url: ingestaOutput?.component_raw_conf_link || '' },
    { label: "JSON", url: ingestaOutput?.component_raw_json_link || '' }
  ];

  const masterLinks = [
    { label: "CONF", url: ingestaOutput?.component_master_conf_link || '' },
    { label: "JSON", url: ingestaOutput?.component_master_json_link || '' }
  ];

  const l1tLinks = [
    { label: "CONF", url: ingestaOutput?.component_l1t_master_conf_link || '' },
    { label: "JSON", url: ingestaOutput?.component_l1t_master_json_link || '' }
  ];

  const stepsConfig = {
    raw: [
      { label: 'Extrayendo las posiciones y longitudes de campos específicos para archivos RAW', duration: 6000 },
      { label: 'Organizando la información de campos RAW incluyendo posiciones, longitudes y tipos de datos', duration: 6000 },
      { label: 'Preparando la plantilla de configuración RAW', duration: 6000 },
      { label: 'Generando el archivo de configuración RAW con definiciones de campos y configuraciones de rutas', duration: 6000 },
      { label: 'Preparando la configuración JSON con las especificaciones del job específicas para RAW', duration: 6000 }
    ],
    master: [
      { label: 'Extrayendo las posiciones y longitudes de campos específicos para archivos MASTER', duration: 6000 },
      { label: 'Organizando la información de campos MASTER incluyendo posiciones, longitudes y tipos de datos', duration: 6000 },
      { label: 'Preparando la plantilla de configuración MASTER', duration: 6000 },
      { label: 'Generando el archivo de configuración MASTER con definiciones de campos y configuraciones de rutas', duration: 6000 },
      { label: 'Preparando la configuración JSON con las especificaciones del job específicas para MASTER', duration: 6000 }
    ],
    l1t: [
      { label: 'Extrayendo las posiciones y longitudes de campos específicos para archivos L1T', duration: 10000 },
      { label: 'Procesando la información del archivo fuente y extrayendo los prefijos de archivo', duration: 10000 },
      { label: 'Generando archivos de configuración y JSON para L1T', duration: 10000 }
    ]
  };

  const canExecuteRaw = ingestaOutput !== null && 
    ingestaOutput.dictionary_raw_header_link !== null &&
    ingestaOutput.dictionary_raw_header_link !== '' && 
    ingestaOutput.dictionary_raw_details_link !== null &&
    ingestaOutput.dictionary_raw_details_link !== '';

  const canExecuteMaster = ingestaOutput !== null && 
    ingestaOutput.dictionary_master_header_link !== null &&
    ingestaOutput.dictionary_master_header_link !== '' && 
    ingestaOutput.dictionary_master_details_link !== null &&
    ingestaOutput.dictionary_master_details_link !== '';

  const canExecuteL1T = ingestaOutput !== null && 
    ingestaOutput.component_master_conf_link !== null &&
    ingestaOutput.component_master_conf_link !== '' && 
    ingestaOutput.component_master_json_link !== null &&
    ingestaOutput.component_master_json_link !== '';

  const handleGenerate = async (stepId: string) => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    
    try {
      if (stepId === 'raw') {
        setShowRawProgress(true);
        const totalDuration = stepsConfig.raw.reduce((acc, step) => acc + step.duration, 0);

        const processPromise = generateRawFiles({
          id_object: objectId
        }, user.email, country);

        const timerPromise = new Promise(resolve => setTimeout(resolve, totalDuration));

        await Promise.all([
          processPromise,
          timerPromise
        ]).then(() => processPromise);

        await fetchIngestaOutput();
      } else if (stepId === 'master') {
        setShowMasterProgress(true);
        const totalDuration = stepsConfig.master.reduce((acc, step) => acc + step.duration, 0);

        const processPromise = generateMasterFiles({
          id_object: objectId
        }, user.email, country);

        const timerPromise = new Promise(resolve => setTimeout(resolve, totalDuration));

        await Promise.all([
          processPromise,
          timerPromise
        ]).then(() => processPromise);

        await fetchIngestaOutput();
      } else if (stepId === 'l1t') {
        setShowL1TProgress(true);
        const totalDuration = stepsConfig.l1t.reduce((acc, step) => acc + step.duration, 0);

        const processPromise = generateL1TMasterFiles({
          id_object: objectId
        }, user.email, country);

        const timerPromise = new Promise(resolve => setTimeout(resolve, totalDuration));

        await Promise.all([
          processPromise,
          timerPromise
        ]).then(() => processPromise);

        await fetchIngestaOutput();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Error al generar ${stepId}`);
    } finally {
      if (stepId === 'raw') {
        setShowRawProgress(false);
      } else if (stepId === 'master') {
        setShowMasterProgress(false);
      } else if (stepId === 'l1t') {
        setShowL1TProgress(false);
      }
    }
  };

  const getControls = (stepId: string) => {
    const getDisabledState = (step: string) => {
      switch (step) {
        case 'raw':
          return !canExecuteRaw;
        case 'master':
          return !canExecuteMaster;
        case 'l1t':
          return !canExecuteL1T;
        default:
          return false;
      }
    };

    const getTooltip = (step: string) => {
      const isL1TDisabled = objectData?.flag_l1t === false;
      
      switch (step) {
        case 'raw':
          return !canExecuteRaw ? 'Se requieren los links del diccionario raw' : PROCESS_TITLES.raw;
        case 'master':
          return !canExecuteMaster ? 'Se requieren los links del diccionario master' : PROCESS_TITLES.master;
        case 'l1t':
          if (isL1TDisabled) return 'L1T no habilitado para este objeto';
          return !canExecuteL1T ? 'Se requieren los links de componentes master' : PROCESS_TITLES.l1t;
        default:
          return undefined;
      }
    };

    return (
      <BoxFlowControls
        leftIcons={[{
          icon: <PlayIcon className="h-5 w-5" />,
          onClick: () => handleGenerate(stepId),
          className: "text-green-500 hover:text-green-600",
          disabled: stepId === 'l1t' ? 
            (objectData?.flag_l1t === false || !canExecuteL1T) : 
            getDisabledState(stepId),
          tooltip: getTooltip(stepId)
        }]}
        rightIcons={[{
          icon: <EyeIcon className="h-5 w-5" />,
          onClick: () => {
            setSelectedStep(stepId);
            setIsLinksPopupOpen(true);
          },
          className: "text-blue-500 hover:text-blue-600",
          disabled: stepId === 'l1t' && objectData?.flag_l1t === false
        }]}
      />
    );
  };

  return (
    <>
      <div className="relative p-8">
        <div className="flex items-center gap-12">
          {/* Línea de conexión Raw-Master */}
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

          {/* BoxFlowCard Raw */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Raw"
              isStatic={true}
              className="border-2 border-[#94B5F0]"
              controls={getControls('raw')}
            />
          </div>

          {/* BoxFlowCard Master */}
          <div className="relative z-10">
            <BoxFlowCard
              title="Master"
              isStatic={true}
              className="border-2 border-[#94B5F0]"
              controls={getControls('master')}
            />
          </div>

          {/* Línea de conexión Master-L1T */}
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

      <PopupLinks
        isOpen={isLinksPopupOpen}
        onClose={() => setIsLinksPopupOpen(false)}
        links={selectedStep === 'raw' ? rawLinks : selectedStep === 'master' ? masterLinks : l1tLinks}
      />

      {showRawProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.raw}
          steps={stepsConfig.raw}
          onComplete={() => setShowRawProgress(false)}
        />
      )}

      {showMasterProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.master}
          steps={stepsConfig.master}
          onComplete={() => setShowMasterProgress(false)}
        />
      )}

      {showL1TProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.l1t}
          steps={stepsConfig.l1t}
          onComplete={() => setShowL1TProgress(false)}
        />
      )}

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 