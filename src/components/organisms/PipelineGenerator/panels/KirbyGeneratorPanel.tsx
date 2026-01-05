'use client';

import { useState } from 'react';
import {
  PlayIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArchiveBoxArrowDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { InfoPanel } from '@/components/molecules/InfoPanel';
import { GeneratorPanelProps } from '../types';
import { usePipelineGeneratorService, GenerateKirbyResponse } from '@/services/PipelineGenerator';
import { useFileOperations } from '@/hooks/useFileOperations';


export const KirbyGeneratorPanel = ({
  rawSchema,
  masterSchema,
  componentType,
  canGenerate,
  onGenerationComplete
}: GeneratorPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<GenerateKirbyResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pipelineGeneratorService = usePipelineGeneratorService();
  const { selectedFileContent, viewFileContent, downloadFile, closeFileContent } = useFileOperations();

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const steps = pipelineGeneratorService.generateProgressSteps('kirby');

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(((i + 1) / steps.length) * 100);
      }

      // Parse schema files to JSON
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

      // Agregar archivos de configuración dinámicamente
      Object.entries(generationResults.configs).forEach(([key, file]) => {
        if (file) {
          const folder = confsFolder!.folder(key);
          folder.file(file.file_name, file.content);
        }
      });

      // Agregar archivos de jobs dinámicamente
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

  // Helper para renderizar lista de archivos
  const renderFileList = (files: Record<string, { file_name: string; content: string } | undefined>, title: string) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {Object.entries(files).map(([key, file]) => {
          if (!file) return null;
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 flex-1 pr-2">{file.file_name}</span>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewFileContent(file)}
                  className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                >
                  Ver contenido
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(file)}
                  className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                  title="Descargar"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kirby Generator</h2>
          <p className="text-sm text-gray-600">Ingesta Staging → Raw → Master</p>
        </div>
      </div>

      {/* Configurations Generated */}
      <InfoPanel title="Configuraciones Generadas" variant="info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentType === 'tabla' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-700 mr-2" />
                <h4 className="font-medium text-blue-900">Raw Configuration</h4>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• CSV → Table ingestion</li>
                <li>• Dynamic partitioning</li>
                <li>• Schema validation</li>
              </ul>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <InformationCircleIcon className="h-4 w-4 text-blue-700 mr-2" />
              <h4 className="font-medium text-blue-900">Master Configuration</h4>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Partition filtering</li>
              <li>• Type casting</li>
              <li>• Trim operations</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <InformationCircleIcon className="h-4 w-4 text-blue-700 mr-2" />
              <h4 className="font-medium text-blue-900">Master L1T Configuration</h4>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Auto-generated for L2</li>
              <li>• Partition filtering</li>
            </ul>
          </div>
        </div>
      </InfoPanel>

      {/* Critical Validations Warning */}
      <InfoPanel title="Validaciones Críticas" variant="warning">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mt-1 mr-3 flex-shrink-0" />
          <div className="text-sm text-amber-800 space-y-1">
            <div><strong>Archivos CSV:</strong> Validar propiedades (header, delimitador, encoding)</div>
            <div><strong>Jobs:</strong> Reemplazar `&lt;PROJECT&gt;` y `&lt;REPO_NAME&gt;` en archivos JSON generados</div>
          </div>
        </div>
      </InfoPanel>

      {/* Generation Controls */}
      <InfoPanel title="Controles de Generación" variant="neutral">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="flex items-center"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            {isGenerating ? 'Generando...' : 'Generar Configuraciones'}
          </Button>

          {!canGenerate && (
            <span className="text-sm text-red-600">
              {componentType === 'tabla'
                ? 'Se requieren schemas Raw y Master'
                : 'Se requiere schema Master'}
            </span>
          )}
        </div>

        {isGenerating && (
          <div>
            <ProgressBar
              progress={progress}
              className="mb-2"
            />
            <p className="text-sm text-gray-600">Procesando configuraciones Kirby...</p>
          </div>
        )}
      </InfoPanel>

      {generationResults && (
        <InfoPanel title="Generación Completada" variant="success">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
              <span className="text-sm text-green-800">Archivos generados exitosamente</span>
            </div>
            <Button
              onClick={downloadAllAsZip}
              className="flex items-center"
              variant="primary"
            >
              <ArchiveBoxArrowDownIcon className="h-4 w-4 mr-2" />
              Descargar Todo
            </Button>
          </div>

          {/* Metadata Info */}
          {generationResults.metadata && (
            <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Información de Generación</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Componente:</span>
                  <span className="ml-2 text-blue-600 capitalize">{generationResults.metadata.componentType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nivel Seguridad:</span>
                  <span className="ml-2 text-blue-600">{generationResults.metadata.masterSecurityLevel}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Alias:</span>
                  <span className="ml-2 text-blue-600">{generationResults.metadata.extractedInfo.alias}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Namespace:</span>
                  <span className="ml-2 text-blue-600">{generationResults.metadata.extractedInfo.namespace}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFileList(generationResults.configs, 'Archivos de Configuración')}
            {renderFileList(generationResults.jobs, 'Archivos de Jobs')}
          </div>
        </InfoPanel>
      )}

      {/* File Content Viewer */}
      {selectedFileContent && (
        <InfoPanel title={`Contenido: ${selectedFileContent.name}`} variant="neutral">
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={closeFileContent}
            >
              Cerrar
            </Button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm max-h-96 whitespace-pre-wrap">
            {selectedFileContent.content}
          </pre>
        </InfoPanel>
      )}

      {/* Error Display */}
      {error && (
        <InfoPanel title="Error en la Generación" variant="warning">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </InfoPanel>
      )}
    </div>
  );
};
