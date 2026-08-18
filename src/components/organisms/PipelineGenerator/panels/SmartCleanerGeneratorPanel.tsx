'use client';

import { useState, useEffect } from 'react';
import {
  PlayIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArchiveBoxArrowDownIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { GeneratorPanelProps } from '../types';
import { usePipelineGeneratorService, GenerateSmartCleanerResponse } from '@/services/PipelineGenerator';
import { addCiConfigToZip, ciConfigAsFile } from '../ciConfig';
import { useFileOperations } from '@/hooks/useFileOperations';
import { FilePreviewModal } from '@/components/molecules/FilePreviewModal';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';


export const SmartCleanerGeneratorPanel = ({
  objectId,
  rawSchema,
  masterSchema,
  componentType,
  canGenerate,
  onGenerationComplete,
  initialData,
  periodicity,
  aliasOverride,
}: GeneratorPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerateSmartCleanerResponse['data'] | null>(null);
  const [isFromSavedData, setIsFromSavedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showWarningTooltip, setShowWarningTooltip] = useState(false);
  const pipelineGeneratorService = usePipelineGeneratorService();
  const { selectedFileContent, viewFileContent, downloadFile, closeFileContent } = useFileOperations();
  const { progress, currentStep, start: startProgress, finish: finishProgress, abort: abortProgress } =
    useGenerationProgress(pipelineGeneratorService.generateProgressSteps('smartcleaner'));

  useEffect(() => {
    if (initialData?.artifacts_data) {
      setGenerationResults(initialData.artifacts_data as GenerateSmartCleanerResponse['data']);
      setIsFromSavedData(true);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);
    setIsFromSavedData(false);

    try {
      let rawSchemaData = undefined;
      if (rawSchema) {
        try {
          const rawContent = await rawSchema.text();
          rawSchemaData = JSON.parse(rawContent);
        } catch (parseError) {
          throw new Error(`Error parseando schema Raw: ${parseError instanceof Error ? parseError.message : 'JSON inválido'}`);
        }
      }

      let masterSchemaData;
      try {
        const masterContent = await masterSchema!.text();
        masterSchemaData = JSON.parse(masterContent);
      } catch (parseError) {
        throw new Error(`Error parseando schema Master: ${parseError instanceof Error ? parseError.message : 'JSON inválido'}`);
      }

      const requestData = {
        object_id: objectId,
        raw_schema_data: rawSchemaData,
        master_schema_data: masterSchemaData,
        component_type: componentType,
        include_l1t: true,
        periodicity,
        alias: aliasOverride?.trim() || undefined,
      };

      // El indicador corre en paralelo al request, no antes.
      startProgress();
      const response = await pipelineGeneratorService.generateSmartCleaner(requestData);

      if (response.success) {
        finishProgress();
        setGenerationResults(response.data);
        onGenerationComplete?.();
      } else {
        throw new Error(response.message || 'Error en la generación');
      }

    } catch (err) {
      abortProgress();
      setError(err instanceof Error ? err.message : 'Error en la generación');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllAsZip = async () => {
    if (!generationResults) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      addCiConfigToZip(zip);

      const othersFolder = zip.folder('others');
      const confsFolder = othersFolder!.folder('confs');
      const jobsFolder = othersFolder!.folder('jobs');

      Object.entries(generationResults.configs).forEach(([key, file]) => {
        if (file) {
          const folderName = key === 'l1t' ? 'master' : key;
          const folder = confsFolder!.folder(folderName);
          folder.file(file.file_name, file.content);
        }
      });

      Object.entries(generationResults.jobs).forEach(([, file]) => {
        if (file) {
          jobsFolder!.file(file.file_name, file.content);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smartcleaner_components.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (zipError) {
      console.error('Error generando ZIP:', zipError);
      await downloadAllIndividually();
    }
  };

  const downloadAllIndividually = async () => {
    if (!generationResults) return;

    const allFiles = [
      ...Object.values(generationResults.configs),
      ...Object.values(generationResults.jobs)
    ].filter(Boolean);

    downloadFile(ciConfigAsFile());
    await new Promise(resolve => setTimeout(resolve, 200));

    for (const file of allFiles) {
      if (file) {
        downloadFile(file);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };

  const configsCount = generationResults ? Object.values(generationResults.configs).filter(Boolean).length : 0;
  const jobsCount = generationResults ? Object.values(generationResults.jobs).filter(Boolean).length : 0;
  const totalFiles = configsCount + jobsCount;

  return (
    <div className="p-6">
      {/* Generation Control Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="flex items-center"
            variant="primary"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Generar'}
          </Button>

          {!canGenerate && (
            <span className="text-sm text-gray-500">
              {componentType === 'tabla' ? 'Requiere schemas Raw y Master' : 'Requiere schema Master'}
            </span>
          )}

          {generationResults && !isGenerating && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-success-icon mr-1" />
              {totalFiles} archivos
              {isFromSavedData && (initialData?.update_date || initialData?.creation_date) && (
                <span className="ml-2 text-xs text-gray-400">
                  <ClockIcon className="h-3 w-3 inline mr-1" />
                  {new Date(initialData.update_date || initialData.creation_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info Tooltips */}
        <div className="flex items-center gap-2">
          {/* Info Tooltip - Retention Rules */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
              className="p-1.5 text-gray-400 hover:text-timia-accent hover:bg-gray-50 rounded transition-colors"
              title="Reglas de retención"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
            {showInfoTooltip && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                <h4 className="font-medium text-gray-900 text-sm mb-2">Reglas de Retención Inteligente</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium text-purple-700">Daily:</span>
                    <span>Raw 45d, Master 365d, 3 particiones</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-purple-700">Monthly:</span>
                    <span>Raw 2m, Master 5y, 2 particiones</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-purple-700">Annual:</span>
                    <span>Raw 2y, Master 8y, 1 partición</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Warning Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowWarningTooltip(true)}
              onMouseLeave={() => setShowWarningTooltip(false)}
              className="p-1.5 text-gray-400 hover:text-warning-icon hover:bg-warning-subtle rounded transition-colors"
              title="Notas"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
            </button>
            {showWarningTooltip && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-warning-border rounded-lg shadow-lg p-3 z-50">
                <h4 className="font-medium text-amber-900 text-sm mb-2">Notas</h4>
                <ul className="space-y-1 text-xs text-amber-800">
                  <li>• Retención calculada automáticamente según frecuencia detectada</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mb-6">
          <ProgressBar progress={progress} className="mb-2" />
          <p className="text-sm text-gray-500">{currentStep || 'Iniciando...'}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-danger-subtle border border-danger-border rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-danger-icon flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {generationResults && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Results Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Archivos Generados</span>
            <Button
              onClick={downloadAllAsZip}
              size="sm"
              variant="primary"
              className="flex items-center"
            >
              <ArchiveBoxArrowDownIcon className="h-4 w-4 mr-1" />
              Descargar ZIP
            </Button>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Configs Column */}
            <div className="p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Configs ({configsCount})
              </h4>
              <div className="space-y-2">
                {Object.entries(generationResults.configs).map(([key, file]) => {
                  if (!file) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group">
                      <span className="text-sm text-gray-700 truncate flex-1 mr-2" title={file.file_name}>
                        {file.file_name}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => viewFileContent(file)}
                          className="p-1 text-gray-400 hover:text-timia-accent hover:bg-gray-50 rounded"
                          title="Ver contenido"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-1 text-gray-400 hover:text-success hover:bg-success-subtle rounded"
                          title="Descargar"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Jobs Column */}
            <div className="p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Jobs ({jobsCount})
              </h4>
              <div className="space-y-2">
                {Object.entries(generationResults.jobs).map(([key, file]) => {
                  if (!file) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group">
                      <span className="text-sm text-gray-700 truncate flex-1 mr-2" title={file.file_name}>
                        {file.file_name}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => viewFileContent(file)}
                          className="p-1 text-gray-400 hover:text-timia-accent hover:bg-gray-50 rounded"
                          title="Ver contenido"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-1 text-gray-400 hover:text-success hover:bg-success-subtle rounded"
                          title="Descargar"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <FilePreviewModal file={selectedFileContent} onClose={closeFileContent} />
    </div>
  );
};