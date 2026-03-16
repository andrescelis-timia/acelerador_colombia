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
import { usePipelineGeneratorService, GenerateKirbyResponse } from '@/services/PipelineGenerator';
import { useFileOperations } from '@/hooks/useFileOperations';


export const KirbyGeneratorPanel = ({
  objectId,
  rawSchema,
  masterSchema,
  componentType,
  canGenerate,
  onGenerationComplete,
  initialData
}: GeneratorPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [generationResults, setGenerationResults] = useState<GenerateKirbyResponse['data'] | null>(null);
  const [isFromSavedData, setIsFromSavedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showWarningTooltip, setShowWarningTooltip] = useState(false);
  const pipelineGeneratorService = usePipelineGeneratorService();
  const { selectedFileContent, viewFileContent, downloadFile, closeFileContent } = useFileOperations();

  useEffect(() => {
    if (initialData?.artifacts_data) {
      setGenerationResults(initialData.artifacts_data as GenerateKirbyResponse['data']);
      setIsFromSavedData(true);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setIsFromSavedData(false);

    try {
      const steps = pipelineGeneratorService.generateProgressSteps('kirby');

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(((i + 1) / steps.length) * 100);
      }

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
        include_l1t: true
      };

      const response = await pipelineGeneratorService.generateKirby(requestData);

      if (response.success) {
        setGenerationResults(response.data);
        onGenerationComplete?.();
      } else {
        throw new Error(response.message || 'Error en la generación');
      }

    } catch (err) {
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

      const kirbyFolder = zip.folder('kirby');
      const confsFolder = kirbyFolder!.folder('confs');
      const jobsFolder = kirbyFolder!.folder('jobs');

      Object.entries(generationResults.configs).forEach(([key, file]) => {
        if (file) {
          const folder = confsFolder!.folder(key);
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
      link.download = 'kirby_components.zip';
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
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
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
          {/* Info Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Configuraciones generadas"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
            {showInfoTooltip && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                <h4 className="font-medium text-gray-900 text-sm mb-2">Configuraciones Generadas</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  {componentType === 'tabla' && (
                    <div>
                      <span className="font-medium text-blue-700">Raw:</span> CSV → Table ingestion, partitioning, schema validation
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-blue-700">Master:</span> Partition filtering, type casting, trim operations
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Master L1T:</span> Auto-generated for L2 security level
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
              className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors"
              title="Validaciones críticas"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
            </button>
            {showWarningTooltip && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-amber-200 rounded-lg shadow-lg p-3 z-50">
                <h4 className="font-medium text-amber-900 text-sm mb-2">Validaciones Críticas</h4>
                <ul className="space-y-1 text-xs text-amber-800">
                  <li>• Validar propiedades CSV (header, delimitador, encoding)</li>
                  <li>• Reemplazar <code className="bg-amber-100 px-1 rounded">&lt;PROJECT&gt;</code> y <code className="bg-amber-100 px-1 rounded">&lt;REPO_NAME&gt;</code> en jobs</li>
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
        <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
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
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver contenido"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
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
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver contenido"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
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

      {/* File Content Viewer Modal */}
      {selectedFileContent && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeFileContent}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col border-2 border-gray-300 ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <span className="font-medium text-gray-900 truncate">{selectedFileContent.name}</span>
              <Button size="sm" variant="outline" onClick={closeFileContent}>
                Cerrar
              </Button>
            </div>
            <pre className="flex-1 overflow-auto p-4 bg-white text-sm font-mono whitespace-pre-wrap">
              {selectedFileContent.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};