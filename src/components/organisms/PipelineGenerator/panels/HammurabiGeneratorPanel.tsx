'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArchiveBoxArrowDownIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { InfoPanel } from '@/components/molecules/InfoPanel';
import { GeneratorPanelProps } from '../types';
import { usePipelineGeneratorService, GenerateHammurabiResponse } from '@/services/PipelineGenerator';
import { useFileOperations } from '@/hooks/useFileOperations';

export const HammurabiGeneratorPanel = ({
  rawSchema,
  masterSchema,
  componentType,
  canGenerate,
  onGenerationComplete
}: GeneratorPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<GenerateHammurabiResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pipelineGeneratorService = usePipelineGeneratorService();
  const { selectedFileContent, viewFileContent, downloadFile, closeFileContent } = useFileOperations();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    
    try {
      const steps = pipelineGeneratorService.generateProgressSteps('hammurabi');
      
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
      
      console.log('Sending Hammurabi request:', requestData);
      
      const response = await pipelineGeneratorService.generateHammurabi(requestData);
      
      console.log('Hammurabi response received:', response);

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
      // Importación dinámica para evitar problemas con SSR/Turbopack
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Crear estructura de carpetas hammurabi/
      const hammurabiFolder = zip.folder('hammurabi');
      const confsFolder = hammurabiFolder!.folder('confs');
      const jobsFolder = hammurabiFolder!.folder('jobs');

      // Agregar archivos de configuración
      if (componentType === 'tabla' && generationResults.configs.staging) {
        const stagingFolder = confsFolder!.folder('staging');
        stagingFolder.file(generationResults.configs.staging.file_name, generationResults.configs.staging.content);
      }

      if (componentType === 'tabla' && generationResults.configs.raw) {
        const rawFolder = confsFolder!.folder('raw');
        rawFolder.file(generationResults.configs.raw.file_name, generationResults.configs.raw.content);
      }
      
      if (generationResults.configs.master) {
        const masterFolder = confsFolder!.folder('master');
        masterFolder.file(generationResults.configs.master.file_name, generationResults.configs.master.content);
        
        // Agregar archivo L1T en la misma carpeta master si existe
        if (generationResults.configs.l1t) {
          masterFolder.file(generationResults.configs.l1t.file_name, generationResults.configs.l1t.content);
        }
      }

      // Agregar archivos de jobs
      if (componentType === 'tabla' && generationResults.jobs.staging) {
        jobsFolder!.file(generationResults.jobs.staging.file_name, generationResults.jobs.staging.content);
      }

      if (componentType === 'tabla' && generationResults.jobs.raw) {
        jobsFolder!.file(generationResults.jobs.raw.file_name, generationResults.jobs.raw.content);
      }

      if (generationResults.jobs.master) {
        jobsFolder!.file(generationResults.jobs.master.file_name, generationResults.jobs.master.content);
      }

      if (generationResults.jobs.l1t) {
        jobsFolder!.file(generationResults.jobs.l1t.file_name, generationResults.jobs.l1t.content);
      }

      // Generar y descargar el ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hammurabi_components.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando ZIP:', error);
      // Fallback: descargar archivos individuales
      await downloadAllIndividually();
    }
  };

  const downloadAllIndividually = async () => {
    if (!generationResults) return;

    const files = [];

    // Recopilar todos los archivos disponibles
    if (componentType === 'tabla' && generationResults.configs.staging) {
      files.push({ ...generationResults.configs.staging, file_name: `hammurabi_${generationResults.configs.staging.file_name}` });
    }
    if (componentType === 'tabla' && generationResults.configs.raw) {
      files.push({ ...generationResults.configs.raw, file_name: `hammurabi_${generationResults.configs.raw.file_name}` });
    }
    if (generationResults.configs.master) {
      files.push({ ...generationResults.configs.master, file_name: `hammurabi_${generationResults.configs.master.file_name}` });
    }
    if (generationResults.configs.l1t) {
      files.push({ ...generationResults.configs.l1t, file_name: `hammurabi_${generationResults.configs.l1t.file_name}` });
    }
    if (componentType === 'tabla' && generationResults.jobs.staging) {
      files.push({ ...generationResults.jobs.staging, file_name: `hammurabi_${generationResults.jobs.staging.file_name}` });
    }
    if (componentType === 'tabla' && generationResults.jobs.raw) {
      files.push({ ...generationResults.jobs.raw, file_name: `hammurabi_${generationResults.jobs.raw.file_name}` });
    }
    if (generationResults.jobs.master) {
      files.push({ ...generationResults.jobs.master, file_name: `hammurabi_${generationResults.jobs.master.file_name}` });
    }
    if (generationResults.jobs.l1t) {
      files.push({ ...generationResults.jobs.l1t, file_name: `hammurabi_${generationResults.jobs.l1t.file_name}` });
    }

    // Descargar cada archivo con un pequeño delay
    for (const file of files) {
      downloadFile(file);
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay entre descargas
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hammurabi Generator</h2>
          <p className="text-sm text-gray-600">Reglas de calidad de datos</p>
        </div>
      </div>

      {/* Consolidated Rules by Phase */}
      <InfoPanel title="Reglas de Calidad por Fase" variant="info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentType === 'tabla' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                  <h4 className="font-medium text-blue-900">Staging</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li><strong>2.1:</strong> CompletenessRule</li>
                  <li><strong>3.1:</strong> NotNullValidationRule</li>
                  <li><strong>3.2:</strong> FormatValidationRule</li>
                  <li><strong>4.2:</strong> DuplicateRule</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                  <h4 className="font-medium text-blue-900">Raw</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li><strong>2.2:</strong> BasicPerimeterCompletenessRule</li>
                </ul>
              </div>
            </>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <h4 className="font-medium text-blue-900">
                {componentType === 'tablon' ? 'Master' : 'Master & Master L1T'}
              </h4>
            </div>
            <ul className="text-sm text-blue-800 space-y-2">
              {componentType === 'tablon' ? (
                <>
                  <li><strong>3.1:</strong> NotNullValidationRule</li>
                  <li><strong>3.2:</strong> FormatValidationRule</li>
                  <li><strong>4.2:</strong> DuplicateRule</li>
                </>
              ) : (
                <>
                  <li><strong>2.3:</strong> ConditionalPerimeterCompletenessRule</li>
                  <li className="text-xs text-blue-600 italic">Master L1T aplica solo para securityLevel L2</li>
                </>
              )}
            </ul>
          </div>
          {componentType === 'tablon' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <h4 className="font-medium text-blue-900">Master L1T</h4>
              </div>
              <ul className="text-sm text-blue-800 space-y-2">
                <li><strong>2.3:</strong> ConditionalPerimeterCompletenessRule</li>
                <li className="text-xs text-blue-600 italic">Solo aplica para securityLevel L2</li>
              </ul>
            </div>
          )}
        </div>
      </InfoPanel>

      {/* Critical Validations Warning */}
      <InfoPanel title="Validaciones Críticas" variant="warning">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mt-1 mr-3 flex-shrink-0" />
          <div className="text-sm text-amber-800 space-y-1">
            <div><strong>Archivos CSV:</strong> Validar propiedades (header, delimitador, encoding)</div>
            <div><strong>Regla 4.2 (Duplicados):</strong> Validar campos clave reales</div>
            <div><strong>Jobs:</strong> Reemplazar `&lt;PROJECT&gt;` en archivos JSON generados</div>
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
            {isGenerating ? 'Generando...' : 'Generar Reglas de Calidad'}
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
            <p className="text-sm text-gray-600">Procesando reglas de calidad...</p>
          </div>
        )}
      </InfoPanel>

      {generationResults && (
        <InfoPanel title="Generación Completada" variant="success">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
              <span className="text-sm text-green-800">Reglas generadas exitosamente</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Configuration Files */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Archivos de Configuración</h4>
              <div className="space-y-2">
                {generationResults.configs.staging && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.configs.staging.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.configs.staging)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.configs.staging)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {generationResults.configs.raw && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.configs.raw.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.configs.raw)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.configs.raw)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {generationResults.configs.master && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.configs.master.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.configs.master)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.configs.master)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {generationResults.configs.l1t && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.configs.l1t.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.configs.l1t)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.configs.l1t)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Files */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Archivos de Jobs</h4>
              <div className="space-y-2">
                {generationResults.jobs.staging && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.jobs.staging.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.jobs.staging)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.jobs.staging)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {generationResults.jobs.raw && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.jobs.raw.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.jobs.raw)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.jobs.raw)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {generationResults.jobs.master && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.jobs.master.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.jobs.master)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.jobs.master)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {generationResults.jobs.l1t && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 pr-2">{generationResults.jobs.l1t.file_name}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewFileContent(generationResults.jobs.l1t)}
                        className="text-xs px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                      >
                        Ver contenido
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadFile(generationResults.jobs.l1t)}
                        className="px-2 py-1 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mt-1 mr-3 flex-shrink-0" />
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        </InfoPanel>
      )}
    </div>
  );
};