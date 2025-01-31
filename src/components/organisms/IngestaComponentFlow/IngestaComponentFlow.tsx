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
import { generateRawFiles, generateMasterFiles } from '@/services/IngestaComponentsGenerator';

export const IngestaComponentFlow = ({ objectId }: IngestaComponentFlowProps) => {
  const { user, country } = useAuth();
  const [isLinksPopupOpen, setIsLinksPopupOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showRawProgress, setShowRawProgress] = useState(false);
  const [showMasterProgress, setShowMasterProgress] = useState(false);
  const [ingestaOutput, setIngestaOutput] = useState<IngestaOutputResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchIngestaOutput = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getIngestaOutputByObjectId(objectId, user.email, country);
      setIngestaOutput(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al obtener datos de ingesta');
    }
  }, [objectId, user?.email, country]);

  useEffect(() => {
    fetchIngestaOutput();
  }, [fetchIngestaOutput]);

  const rawLinks = [
    { label: "CONF", url: ingestaOutput?.component_raw_conf_link || '' },
    { label: "JSON", url: ingestaOutput?.component_raw_json_link || '' }
  ];

  const masterLinks = [
    { label: "CONF", url: ingestaOutput?.component_master_conf_link || '' },
    { label: "JSON", url: ingestaOutput?.component_master_json_link || '' }
  ];

  const stepsConfig = {
    raw: [
      { label: 'Extrayendo las posiciones y longitudes de campos específicos para archivos RAW', duration: 4300 },
      { label: 'Procesando la información del archivo fuente y extrayendo los prefijos de archivo de las rutas de origen', duration: 4300 },
      { label: 'Organizando la información de campos RAW incluyendo posiciones, longitudes y tipos de datos', duration: 4300 },
      { label: 'Preparando la plantilla de configuración RAW', duration: 4300 },
      { label: 'Generando el archivo de configuración RAW con definiciones de campos y configuraciones de rutas', duration: 4300 },
      { label: 'Preparando la configuración JSON con las especificaciones del job específicas para RAW', duration: 4300 },
      { label: 'Subiendo los archivos generados a la carpeta Raw en Google Drive y verificando que se guardaron correctamente', duration: 4200 }
    ],
    master: [
      { label: 'Extrayendo las posiciones y longitudes de campos específicos para archivos MASTER', duration: 4300 },
      { label: 'Procesando la información del archivo fuente y extrayendo los prefijos de archivo de las rutas de origen', duration: 4300 },
      { label: 'Organizando la información de campos MASTER incluyendo posiciones, longitudes y tipos de datos', duration: 4300 },
      { label: 'Preparando la plantilla de configuración MASTER', duration: 4300 },
      { label: 'Generando el archivo de configuración MASTER con definiciones de campos y configuraciones de rutas', duration: 4300 },
      { label: 'Preparando la configuración JSON con las especificaciones del job específicas para MASTER', duration: 4300 },
      { label: 'Subiendo los archivos generados a la carpeta Master en Google Drive y verificando que se guardaron correctamente', duration: 4200 }
    ]
  };

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
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Error al generar ${stepId}`);
    } finally {
      if (stepId === 'raw') {
        setShowRawProgress(false);
      } else if (stepId === 'master') {
        setShowMasterProgress(false);
      }
    }
  };

  const getControls = (stepId: string) => {
    return (
      <BoxFlowControls
        leftIcons={[{
          icon: <PlayIcon className="h-5 w-5" />,
          onClick: () => handleGenerate(stepId),
          className: "text-green-500 hover:text-green-600",
          disabled: false
        }]}
        rightIcons={[{
          icon: <EyeIcon className="h-5 w-5" />,
          onClick: () => {
            setSelectedStep(stepId);
            setIsLinksPopupOpen(true);
          },
          className: "text-blue-500 hover:text-blue-600",
          disabled: false
        }]}
      />
    );
  };

  return (
    <>
      <div className="relative p-8">
        <div className="flex items-center gap-12">
          {/* Línea de conexión */}
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
        </div>
      </div>

      <PopupLinks
        isOpen={isLinksPopupOpen}
        onClose={() => setIsLinksPopupOpen(false)}
        links={selectedStep === 'raw' ? rawLinks : masterLinks}
      />

      {showRawProgress && (
        <ProgressDialog
          title="Procesando RAW"
          steps={stepsConfig.raw}
          onComplete={() => setShowRawProgress(false)}
        />
      )}

      {showMasterProgress && (
        <ProgressDialog
          title="Procesando MASTER"
          steps={stepsConfig.master}
          onComplete={() => setShowMasterProgress(false)}
        />
      )}

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 