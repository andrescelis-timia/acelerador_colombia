'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { GeneratorPanelProps } from '../types';
import { usePipelineGeneratorService } from '@/services/PipelineGenerator';

export const HammurabiGeneratorPanel = ({
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
        <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hammurabi Generator</h2>
          <p className="text-sm text-gray-600">Reglas de calidad de datos</p>
        </div>
      </div>

      {/* Rules Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Reglas de Calidad Generadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">Reglas de Completeness</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• <strong>2.1:</strong> CompletenessRule (Staging)</li>
              <li>• <strong>2.2:</strong> BasicPerimeterCompletenessRule (Raw)</li>
              <li>• <strong>2.3:</strong> ConditionalPerimeterCompletenessRule (Master)</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">Reglas de Validación</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• <strong>3.1:</strong> NotNullValidationRule</li>
              <li>• <strong>3.2:</strong> FormatValidationRule (con regex)</li>
              <li>• <strong>4.2:</strong> DuplicateRule (campos clave)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Phases */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Fases de Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {componentType === 'tabla' && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <ShieldCheckIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Staging</h4>
                <p className="text-xs text-gray-600">2.1 + 3.1 + 3.2 + 4.2</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <ShieldCheckIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Raw</h4>
                <p className="text-xs text-gray-600">2.2</p>
              </div>
            </>
          )}
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <ShieldCheckIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Master</h4>
            <p className="text-xs text-gray-600">2.3</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <ShieldCheckIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Master L1T</h4>
            <p className="text-xs text-gray-600">2.3 (L2 only)</p>
          </div>
        </div>
      </div>

      {/* Critical Validations Warning */}
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800 mb-2">🚨 Validaciones Críticas</h4>
            <div className="text-sm text-red-800 space-y-1">
              <div><strong>Archivos CSV:</strong> Validar propiedades (header, delimitador, encoding)</div>
              <div><strong>Regla 4.2 (Duplicados):</strong> Identificar manualmente campos clave reales</div>
              <div><strong>Campos Clave:</strong> Sistema detecta campos obligatorios, no necesariamente únicos</div>
              <div><strong>Placeholder:</strong> Reemplazar `&lt;PROJECT&gt;` en archivos JSON generados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Detection Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Detección Automática de Patrones</h4>
            <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
              <div><strong>_amount, _per:</strong> (-?\d+[.,]\d+)?</div>
              <div><strong>_number:</strong> (-?\d+)?</div>
              <div><strong>_date:</strong> ^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])...</div>
              <div><strong>_id, _type:</strong> [a-zA-Z0-9]*</div>
              <div><strong>_name, _desc:</strong> [a-zA-Z0-9!@#+=._ :-]*</div>
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
            <div className="mb-4">
              <ProgressBar 
                progress={progress} 
                className="mb-2"
              />
              <p className="text-sm text-gray-600">Procesando reglas de calidad...</p>
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
                {generationResults.configs.staging && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.configs.staging.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.configs.staging)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
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
                {generationResults.jobs.staging && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.jobs.staging.file_name}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewFileContent(generationResults.jobs.staging)}
                    >
                      Ver contenido
                    </Button>
                  </div>
                )}
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