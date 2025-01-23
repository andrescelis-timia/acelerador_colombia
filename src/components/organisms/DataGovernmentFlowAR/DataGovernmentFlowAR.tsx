import { useEffect, useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { DataGovernmentFlowProps } from './types';
import { getDictionaryJsonHeader } from '@/services/DictionaryJsonHeader';
import { DictionaryJsonHeaderResponse } from '@/services/DictionaryJsonHeader/types';
import { getRefinementByObjectId } from '@/services/Refinement';
import { RefinementResponse } from '@/services/Refinement/types';
import { gridLayout, flowStepsConfig } from './config';
import { PlayIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { generateDictionaryJson } from '@/services/DictionaryGenerator';
import { useAuth } from '@/lib/context/AuthContext';
import { getDictionaryJsonDetailsByHeaderId } from '@/services/DictionaryJsonDetail';
import { DictionaryJsonDetailResponse } from '@/services/DictionaryJsonDetail/types';

export const DataGovernmentFlowAR = ({ objectId }: DataGovernmentFlowProps) => {
  const { user, country } = useAuth();
  const [dictionaryJsonHeader, setDictionaryJsonHeader] = useState<DictionaryJsonHeaderResponse | null>(null);
  const [dictionaryJsonDetails, setDictionaryJsonDetails] = useState<DictionaryJsonDetailResponse[]>([]);
  const [refinement, setRefinement] = useState<RefinementResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

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
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [objectId, user?.email, country]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = () => {
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

  const getControls = (stepId: string) => {
    switch (stepId) {
      case 'teradata':
        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: async () => {
                if (!selectedFile || !user?.email) {
                  console.log('Validation failed:', { selectedFile, userEmail: user?.email });
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
                  console.error('Error al generar diccionario:', error);
                }
              },
              className: "text-blue-600 hover:text-blue-800",
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
      case 'dictionary':
      case 'datum':
        return (
          <BoxFlowControls
            leftIcons={[{
              icon: <PlayIcon className="h-5 w-5" />,
              onClick: () => console.log(`Play ${stepId}`),
              className: "text-blue-600 hover:text-blue-800"
            }]}
            rightIcons={[{
              icon: <EyeIcon className="h-5 w-5" />,
              onClick: () => console.log(`View ${stepId}`),
              className: "text-blue-600 hover:text-blue-800"
            }]}
          />
        );
      default:
        return null;
    }
  };

  if (loading) return null;

  return (
    <div className="relative p-8">
      <div className="grid grid-cols-3 gap-x-12 gap-y-8">
        {flowStepsConfig.map((step, index) => (
          <div key={step.id} className="relative col-span-1 row-span-1" style={{
            gridColumn: gridLayout[index].x + 1,
            gridRow: gridLayout[index].y + 1,
          }}>
            <BoxFlowCard
              title={step.title}
              isStatic={step.id !== 'teradata'}
              schema={step.id === 'teradata' ? 'xlsx, xml' : undefined}
              selectedFile={step.id === 'teradata' ? selectedFile : undefined}
              onFileClick={step.id === 'teradata' ? handleFileSelect : undefined}
              className="w-full border border-gray-400"
              controls={getControls(step.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};