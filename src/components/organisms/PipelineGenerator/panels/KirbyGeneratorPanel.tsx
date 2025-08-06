'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { GeneratorPanelProps } from '../types';
import { usePipelineGeneratorService } from '@/services/PipelineGenerator';

export const KirbyGeneratorPanel = ({
  rawSchema,
  masterSchema,
  componentType,
  canGenerate,
  isSelected
}: GeneratorPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const pipelineGeneratorService = usePipelineGeneratorService();

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
      
      console.log('Sending Kirby request:', requestData);
      
      const response = await pipelineGeneratorService.generateKirby(requestData);
      
      console.log('Kirby response received:', response);

      if (response.success) {
        setGenerationResults(response.data);
      } else {
        throw new Error(response.message || 'Error en la generación');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la generación');
    } finally {
      setIsGenerating(false);
    }
  };

  const [selectedFileContent, setSelectedFileContent] = useState<{name: string, content: string} | null>(null);

  const viewFileContent = (file: any) => {
    setSelectedFileContent({
      name: file.file_name,
      content: file.content
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kirby Generator</h2>
          <p className="text-sm text-gray-600">Ingesta CSV → Avro → Parquet</p>
        </div>
      </div>

      {/* Configurations Generated */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Configuraciones Generadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentType === 'tabla' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Raw Configuration</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• CSV → Avro ingestion</li>
                <li>• Dynamic partitioning</li>
                <li>• Schema validation</li>
                <li>• Audit fields</li>
              </ul>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Master Configuration</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Avro → Parquet transformation</li>
              <li>• Type casting</li>
              <li>• Data filtering</li>
              <li>• Trim operations</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">L1T Configuration</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Auto-generated for L2</li>
              <li>• Security filtering</li>
              <li>• Metadata inclusion</li>
              <li>• Schema override</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Critical Validations Warning */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">⚠️ Validaciones Críticas</h4>
            <div className="text-sm text-amber-800 space-y-1">
              <div><strong>Header:</strong> Validar manualmente si el CSV tiene encabezados</div>
              <div><strong>Delimitador:</strong> Confirmar delimitador real (`;`, `,`, `|`, `\t`)</div>
              <div><strong>Encoding:</strong> Verificar codificación del archivo (UTF-8, ISO-8859-1)</div>
              <div><strong>Placeholder:</strong> Reemplazar `&lt;PROJECT&gt;` en archivos JSON generados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Status */}
      {!isSelected && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center text-gray-600">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm">Generador no seleccionado</span>
          </div>
        </div>
      )}

      {/* Generation Controls */}
      {isSelected && (
        <div className="mb-6">
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
            <div className="mb-4">
              <ProgressBar 
                progress={progress} 
                className="mb-2"
              />
              <p className="text-sm text-gray-600">Procesando configuraciones Kirby...</p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {generationResults && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            <span className="text-lg font-medium text-green-800">Generación Completada</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Configuration Files */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Archivos de Configuración</h4>
              <div className="space-y-2">
                {generationResults.configs.raw && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.configs.raw.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.configs.raw)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
                {generationResults.configs.master && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.configs.master.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.configs.master)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
                {generationResults.configs.l1t && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.configs.l1t.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.configs.l1t)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Job Files */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Archivos de Jobs</h4>
              <div className="space-y-2">
                {generationResults.jobs.raw && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.jobs.raw.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.jobs.raw)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
                {generationResults.jobs.master && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.jobs.master.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.jobs.master)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
                {generationResults.jobs.l1t && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.jobs.l1t.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.jobs.l1t)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Content Viewer */}
      {selectedFileContent && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              Contenido: {selectedFileContent.name}
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedFileContent(null)}
            >
              Cerrar
            </Button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm max-h-96 whitespace-pre-wrap">
            {selectedFileContent.content}
          </pre>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">Error en la Generación</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};