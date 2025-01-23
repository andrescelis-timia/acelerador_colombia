import { useEffect, useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PopupLinks } from '@/components/molecules/PopupLinks';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { PreDictionaryInputForm } from '@/components/organisms/PreDictionaryInputForm';
import { DataGovernmentFlowProps } from './types';
import { getDictionaryJsonHeader } from '@/services/DictionaryJsonHeader';
import { DictionaryJsonHeaderResponse } from '@/services/DictionaryJsonHeader/types';
import { getDictionaryJsonDetailsByHeaderId } from '@/services/DictionaryJsonDetail';
import { DictionaryJsonDetailResponse } from '@/services/DictionaryJsonDetail/types';
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

  const stepsConfig = {
    sample: [
      { label: 'Procesando muestra', duration: 500 },
      { label: 'Validando datos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
    ],
    dictionary: [
      { label: 'Generando diccionario', duration: 500 },
      { label: 'Procesando campos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
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
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setDictionaryFile(file);
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
    try {
      await generateDictionaryJson({
        header: {
          id_object: objectId
        },
        details: [] // Los detalles se generarán automáticamente en el backend
      }, user.email, country);
      await fetchData();
    } catch (error) {
      console.error('Error al generar diccionario JSON:', error);
      throw error;
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
              onClick: async () => {
                if (!user?.email || !dictionaryJsonHeader) return;
                setShowDictionaryProgress(true);
                try {
                  await generateDictionaryBase({
                    id_object: objectId
                  }, user.email, country);
                  await fetchDictionaryOutput();
                } catch (error) {
                  console.error('Error al generar diccionario base:', error);
                } finally {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setShowDictionaryProgress(false);
                }
              },
              className: "text-blue-600 hover:text-blue-800",
              disabled: !dictionaryJsonHeader,
              tooltip: !dictionaryJsonHeader ? 'No hay diccionario disponible' : undefined
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => setIsLinksPopupOpen(true),
              className: "text-blue-600 hover:text-blue-800",
              disabled: !dictionaryJsonHeader || !dictionaryJsonDetails.length,
              tooltip: !dictionaryJsonHeader 
                ? 'No hay diccionario disponible'
                : !dictionaryJsonDetails.length 
                ? 'No hay detalles disponibles'
                : undefined
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
          onComplete={() => setShowSampleProgress(false)}
        />
      )}
      
      {showDictionaryProgress && (
        <ProgressDialog
          title="Generando Diccionario"
          steps={stepsConfig.dictionary}
          onComplete={() => setShowDictionaryProgress(false)}
        />
      )}
    </>
  );
}; 