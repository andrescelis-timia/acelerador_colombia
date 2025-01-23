import { useEffect, useState, useCallback } from 'react';
import { PlayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PopupLinks } from '@/components/molecules/PopupLinks';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { IngestaComponentFlowProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';

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

  const fetchIngestaOutput = useCallback(async () => {
    if (!user?.email) return;
    try {
      const data = await getIngestaOutputByObjectId(objectId, user.email, country);
      setIngestaOutput(data);
    } catch (error) {
      console.error('Error fetching ingesta output:', error);
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
      { label: 'Procesando RAW', duration: 500 },
      { label: 'Validando datos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
    ],
    master: [
      { label: 'Procesando MASTER', duration: 500 },
      { label: 'Validando datos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
    ]
  };

  const handleGenerate = async (stepId: string) => {
    if (!user?.email) return;
    try {
      if (stepId === 'raw') {
        setShowRawProgress(true);
      } else if (stepId === 'master') {
        setShowMasterProgress(true);
      }
      // Aquí iría la lógica de generación según el step
      console.log(`Generando ${stepId}...`);
      await fetchIngestaOutput(); // Actualizamos los links después de generar
    } catch (error) {
      console.error(`Error al generar ${stepId}:`, error);
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
    </>
  );
}; 