import { useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { PlayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/context/AuthContext';
import { getIngestaOutputByObjectId } from '@/services/IngestaOutput';
import { IngestaOutputResponse } from '@/services/IngestaOutput/types';
import { generateTable } from '@/services/MER';
import { MERFlowProps } from './types';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';

export const MERFlow = ({ objectId }: MERFlowProps) => {
  const { user, country } = useAuth();
  const [ingestaOutput, setIngestaOutput] = useState<IngestaOutputResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMERProgress, setShowMERProgress] = useState(false);
  const [vbsContent, setVbsContent] = useState<string | null>(null);

  const stepsConfig = {
    mer: [
      { label: 'Extrayendo información del diccionario master', duration: 2000 },
      { label: 'Generando estructura de la tabla', duration: 2000 },
      { label: 'Creando columnas y definiendo tipos de datos', duration: 2000 },
      { label: 'Aplicando restricciones y claves', duration: 2000 },
      { label: 'Generando código VB final', duration: 2000 }
    ]
  };

  const PROCESS_TITLES = {
    mer: 'Generando Tabla MER'
  };

  // Cargar ingestaOutput al montar
  useState(() => {
    const fetchOutput = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        const data = await getIngestaOutputByObjectId(objectId, user.email, country);
        setIngestaOutput(data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar la salida de ingesta');
      } finally {
        setLoading(false);
      }
    };
    fetchOutput();
  });

  // Condición para habilitar el play
  const canExecuteMER =
    ingestaOutput !== null &&
    ingestaOutput.dictionary_master_header_link !== null &&
    ingestaOutput.dictionary_master_header_link !== '' &&
    ingestaOutput.dictionary_master_details_link !== null &&
    ingestaOutput.dictionary_master_details_link !== '';

  // Generar el contenido VBS (no descarga)
  const handleGenerateTable = useCallback(async () => {
    if (!user?.email || !ingestaOutput?.dictionary_master_header_link) return;

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setShowMERProgress(true);
      setVbsContent(null);

      const totalDuration = stepsConfig.mer.reduce((acc, step) => acc + step.duration, 0);

      // Ejecutar el proceso en paralelo con el progress
      const processPromise = generateTable(
        { id_object: objectId },
        user.email,
        country
      );

      // Esperar a que ambos terminen
      await Promise.all([
        processPromise,
        new Promise(resolve => setTimeout(resolve, totalDuration))
      ]);

      const response = await processPromise;

      if (!response) {
        setErrorMessage('No se pudo generar la tabla. No se encontró el diccionario master.');
        return;
      }

      setVbsContent(response.content);

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar la tabla');
    } finally {
      setIsGenerating(false);
      setShowMERProgress(false);
    }
  }, [user?.email, country, objectId, ingestaOutput?.dictionary_master_header_link, stepsConfig.mer]);

  // Descargar el archivo VBS generado
  const handleDownloadVbs = useCallback(() => {
    if (!vbsContent) return;
    const blob = new Blob([vbsContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'create-table.vbs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [vbsContent]);

  if (loading) return null;

  return (
    <>
      <div className="relative p-8">
        <div className="relative z-10">
          <BoxFlowCard
            title="Generar .vbs"
            isStatic={true}
            className="border-2 border-[#94B5F0] max-w-xs"
            controls={
              <BoxFlowControls
                leftIcons={[{
                  icon: <PlayIcon className="h-5 w-5" />,
                  onClick: handleGenerateTable,
                  className: "text-green-500 hover:text-green-600",
                  disabled: !canExecuteMER || isGenerating,
                  tooltip: !canExecuteMER 
                    ? 'Se requieren los links del diccionario master' 
                    : isGenerating 
                      ? 'Generando tabla...' 
                      : 'Generar Tabla'
                }]}
                rightIcons={[{
                  icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                  onClick: handleDownloadVbs,
                  className: "text-blue-500 hover:text-blue-600",
                  disabled: !vbsContent,
                  tooltip: !vbsContent ? 'Primero genera el archivo' : 'Descargar .vbs'
                }]}
              />
            }
          />
          {errorMessage && (
            <div className="mt-4 text-red-600">{errorMessage}</div>
          )}
        </div>
      </div>

      {showMERProgress && (
        <ProgressDialog
          title={PROCESS_TITLES.mer}
          steps={stepsConfig.mer}
          onComplete={() => {}}
        />
      )}
    </>
  );
}; 