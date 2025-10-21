'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { InfoPanel } from '@/components/molecules/InfoPanel';
import { GeneratorPanelProps } from '../types';
import { ReadOnlyWrapper } from '@/components/organisms/ReadOnlyWrapper';

export const SmartCleanerGeneratorPanel = ({
  masterSchema,
  componentType,
  canGenerate,
  onGenerationComplete
}: Pick<GeneratorPanelProps, 'masterSchema' | 'componentType' | 'canGenerate' | 'onGenerationComplete'>) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<{
    success: boolean;
    frequency: string;
    retention: { raw: string; master: string };
    configs: { raw: string | null; master: string; l1t: string };
    jobs: { raw: string | null; master: string; l1t: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    
    try {
      const steps = [
        'Validando schemas de entrada...',
        'Detectando frecuencia automáticamente...',
        'Calculando reglas de retención...',
        'Generando configuración Raw...',
        'Generando configuración Master...',
        'Generando configuración L1T (si aplica)...',
        'Generando jobs JSON...',
        'Finalizando proceso...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(((i + 1) / steps.length) * 100);
      }

      // Simular detección de frecuencia basada en particiones
      const detectedFrequency = masterSchema ? 'monthly' : 'daily'; // Simulado
      
      const results = {
        success: true,
        frequency: detectedFrequency,
        retention: {
          raw: detectedFrequency === 'daily' ? '45D' : detectedFrequency === 'monthly' ? '2M' : '2M',
          master: detectedFrequency === 'daily' ? '365D' : detectedFrequency === 'monthly' ? '5Y' : '8Y'
        },
        configs: {
          raw: componentType === 'tabla' ? 'smcaliasr.conf' : null,
          master: 'smcaliasm.conf',
          l1t: 'smcaliasl1tm.conf'
        },
        jobs: {
          raw: componentType === 'tabla' ? 'namespace-co-dfs-rmv-smcaliasr-01.json' : null,
          master: 'namespace-co-dfs-rmv-smcaliasm-01.json',
          l1t: 'namespace-co-dfs-rmv-smcaliasl1tm-01.json'
        }
      };
      
      setGenerationResults(results);
      onGenerationComplete?.();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la generación');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (type: string) => {
    // Placeholder para descarga de SmartCleaner
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SmartCleaner Generator</h2>
          <p className="text-sm text-gray-600">Limpieza automatizada con retención inteligente</p>
        </div>
      </div>

      {/* Retention Rules */}
      <InfoPanel title="Reglas de Retención Inteligente" variant="info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-blue-900">Daily</h4>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Raw: 45 días</li>
              <li>• Master: 365 días</li>
              <li>• 3+ particiones</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-blue-900">Monthly</h4>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Raw: 2 meses</li>
              <li>• Master: 5 años</li>
              <li>• 2 particiones</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-blue-900">Annual</h4>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Raw: 2 meses</li>
              <li>• Master: 8 años</li>
              <li>• 1 partición</li>
            </ul>
          </div>
        </div>
      </InfoPanel>

      {/* Configuration Features */}
      <InfoPanel title="Características de la Configuración" variant="neutral">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrashIcon className="h-5 w-5 text-purple-500 mr-2" />
              <h4 className="font-medium text-gray-900">Configuración Automática</h4>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Detección automática de frecuencia</li>
              <li>• Retención adaptativa por tipo</li>
              <li>• Configuración cero - totalmente automática</li>
              <li>• Soporte L1T para securityLevel L2</li>
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <InformationCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
              <h4 className="font-medium text-gray-900">Estadísticas y Formato</h4>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Formato JSON para estadísticas</li>
              <li>• Paths automáticos por namespace</li>
              <li>• Simulación deshabilitada</li>
              <li>• Partition discovery habilitado</li>
            </ul>
          </div>
        </div>
      </InfoPanel>

      {/* No Critical Validations */}
      <InfoPanel title="✅ Configuración Totalmente Automática" variant="success">
        <div className="flex items-start">
          <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
          <div className="text-sm text-green-800 space-y-1">
            <div>Solo necesita reemplazar placeholder `&lt;PROJECT&gt;` en jobs JSON</div>
            <div>Todas las reglas de retención se calculan automáticamente</div>
          </div>
        </div>
      </InfoPanel>

      {/* Generation Controls */}
      <InfoPanel title="Controles de Generación" variant="neutral">
        <div className="flex items-center justify-between mb-4">
          <ReadOnlyWrapper fallbackMessage="No disponible">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="flex items-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando...' : 'Generar Configuraciones de Limpieza'}
            </Button>
          </ReadOnlyWrapper>
          
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
            <p className="text-sm text-gray-600">Procesando configuraciones de limpieza...</p>
          </div>
        )}
      </InfoPanel>

      {generationResults && (
        <InfoPanel title="Generación Completada" variant="success">
          <div className="flex items-center mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            <span className="text-sm text-green-800">Configuraciones generadas exitosamente</span>
          </div>

          {/* Detected Configuration */}
          <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Configuración Detectada</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Frecuencia:</span> 
                <span className="ml-2 text-purple-600 capitalize">{generationResults.frequency}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Retención Raw:</span> 
                <span className="ml-2 text-purple-600">{generationResults.retention.raw}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Retención Master:</span> 
                <span className="ml-2 text-purple-600">{generationResults.retention.master}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Configuration Files */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Archivos de Configuración</h4>
              <div className="space-y-2">
                {generationResults.configs.raw && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.configs.raw}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadFile('raw-config')}
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{generationResults.configs.master}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadFile('master-config')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
                {generationResults.configs.l1t && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.configs.l1t}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadFile('l1t-config')}
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
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
                    <span className="text-sm text-gray-700">{generationResults.jobs.raw}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadFile('raw-job')}
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{generationResults.jobs.master}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadFile('master-job')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
                {generationResults.jobs.l1t && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{generationResults.jobs.l1t}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadFile('l1t-job')}
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
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