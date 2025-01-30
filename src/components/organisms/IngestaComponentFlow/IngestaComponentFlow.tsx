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

const flowStepsConfig = [
  { id: 'raw', title: 'Raw' },
  { id: 'master', title: 'Master' },
];

const gridLayout = [
  { x: 0, y: 0 }, // raw
  { x: 1, y: 0 }, // master
];

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
          className: "text-blue-600 hover:text-blue-800",
          disabled: false
        }]}
        rightIcons={[{
          icon: <EyeIcon className="h-5 w-5" />,
          onClick: () => {
            setSelectedStep(stepId);
            setIsLinksPopupOpen(true);
          },
          className: "text-blue-600 hover:text-blue-800",
          disabled: false
        }]}
      />
    );
  };

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
                isStatic={true}
                className="w-full border border-gray-400"
                controls={getControls(step.id)}
              />
            </div>
          ))}
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