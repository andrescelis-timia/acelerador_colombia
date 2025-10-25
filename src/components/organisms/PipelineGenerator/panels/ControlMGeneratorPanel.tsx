'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { FormField } from '@/components/molecules/FormField';
import { InfoPanel } from '@/components/molecules/InfoPanel';
import { ControlMGeneratorPanelProps } from '../types';
import { ReadOnlyWrapper } from '@/components/organisms/ReadOnlyWrapper';

interface XMLFile {
  file: File;
  type: 'T04' | 'T02';
  temporality: string;
  uuaa: string;
}

interface JobEntry {
  name: string;
  type: 'datax' | 'kirby' | 'hammurabi' | 'smartcleaner';
}

export const ControlMGeneratorPanel = ({
  canGenerate,
  onGenerationComplete
}: Pick<ControlMGeneratorPanelProps, 'canGenerate' | 'onGenerationComplete'>) => {
  const [xmlFiles, setXmlFiles] = useState<XMLFile[]>([]);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [dataxConfig, setDataxConfig] = useState({
    periodicity: 'diario',
    periodicityType: 'calendario',
    startTime: '02:00',
    timezone: 'GMT-5',
    isCyclic: false,
    intervalHours: 4,
    monthDay: 1
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<{
    success: boolean;
    uuaa: string;
    temporality: string;
    temporalityCode: string;
    totalJobs: number;
    mallas: {
      dataxDesarrollo: string;
      dataxProduccion: string;
      ingestaDesarrollo: string;
      ingestaProduccion: string;
    };
    sequenceStats: {
      datax: { total: number; transferencias: number };
      ingesta: { 
        total: number;
        calidad: number;
        borrado: number;
        phases: { staging: number; raw: number; master: number; masterL1T: number };
      };
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateXMLFile = async (file: File): Promise<{ type: 'T04' | 'T02' | null, temporality: string, uuaa: string, errors: string[] }> => {
    const errors: string[] = [];
    let type: 'T04' | 'T02' | null = null;
    let temporality = '';
    let uuaa = '';

    try {
      const content = await file.text();
      
      // Validar que es XML válido
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      
      if (parseError.length > 0) {
        errors.push('Archivo XML no válido');
        return { type, temporality, uuaa, errors };
      }

      // Extraer información del nombre del archivo
      const fileName = file.name;
      const match = fileName.match(/CR-CO([A-Z0-9]{3,4})(DIA|SEM|MEN|ANU)-T0([24])\.xml/i);
      
      if (!match) {
        errors.push('Nombre de archivo no sigue el patrón: CR-CO[UUAA][TEMPORALIDAD]-T0[TIPO].xml');
        return { type, temporality, uuaa, errors };
      }

      uuaa = match[1];
      temporality = match[2];
      type = match[3] === '4' ? 'T04' : 'T02';

      // Validaciones adicionales
      if (!['DIA', 'SEM', 'MEN', 'ANU'].includes(temporality.toUpperCase())) {
        errors.push('Temporalidad debe ser DIA, SEM, MEN o ANU');
      }

    } catch {
      errors.push('Error al procesar el archivo XML');
    }

    return { type, temporality, uuaa, errors };
  };

  const handleXMLUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newXmlFiles: XMLFile[] = [];
    const allErrors: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.xml')) {
        allErrors.push(`${file.name}: Debe ser un archivo XML`);
        continue;
      }

      const validation = await validateXMLFile(file);
      if (validation.errors.length > 0) {
        allErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
        continue;
      }

      if (validation.type) {
        newXmlFiles.push({
          file,
          type: validation.type,
          temporality: validation.temporality,
          uuaa: validation.uuaa
        });
      }
    }

    // Validar que tenemos exactamente 1 T04 y 1 T02
    const t04Files = newXmlFiles.filter(f => f.type === 'T04');
    const t02Files = newXmlFiles.filter(f => f.type === 'T02');

    if (t04Files.length !== 1) {
      allErrors.push('Se requiere exactamente 1 archivo T04 (Datax)');
    }
    if (t02Files.length !== 1) {
      allErrors.push('Se requiere exactamente 1 archivo T02 (Ingesta)');
    }

    // Validar coherencia entre XMLs
    if (t04Files.length === 1 && t02Files.length === 1) {
      const t04 = t04Files[0];
      const t02 = t02Files[0];
      
      if (t04.temporality !== t02.temporality) {
        allErrors.push('Los XMLs deben tener la misma temporalidad');
      }
      if (t04.uuaa !== t02.uuaa) {
        allErrors.push('Los XMLs deben tener la misma UUAA');
      }
    }

    setValidationErrors(allErrors);
    if (allErrors.length === 0) {
      setXmlFiles(newXmlFiles);
      // Auto-detectar periodicidad
      if (newXmlFiles.length > 0) {
        const temporality = newXmlFiles[0].temporality;
        const periodicityMap: { [key: string]: string } = {
          'DIA': 'diario',
          'SEM': 'semanal', 
          'MEN': 'mensual',
          'ANU': 'anual'
        };
        setDataxConfig(prev => ({ ...prev, periodicity: periodicityMap[temporality.toUpperCase()] || 'diario' }));
      }
    }
  };

  const addJob = () => {
    setJobs([...jobs, { name: '', type: 'datax' }]);
  };

  const updateJob = (index: number, field: keyof JobEntry, value: string) => {
    const newJobs = [...jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    setJobs(newJobs);
  };

  const removeJob = (index: number) => {
    setJobs(jobs.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!canGenerate || xmlFiles.length !== 2 || jobs.length === 0) return;
    
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    
    try {
      const steps = [
        'Validando XMLs de entrada...',
        'Analizando secuencias existentes...',
        'Generando secuencias de jobs...',
        'Creando mallas Datax (Desarrollo y Producción)...',
        'Creando mallas Ingesta (Desarrollo y Producción)...',
        'Generando dependencias INCOND/OUTCOND...',
        'Aplicando nomenclatura CUUAAXYTZZZ...',
        'Finalizando proceso...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(((i + 1) / steps.length) * 100);
      }

      // Simular resultado
      const uuaa = xmlFiles[0].uuaa;
      const temporality = xmlFiles[0].temporality;
      const temporalityCode = { 'DIA': '0', 'SEM': '1', 'MEN': '4', 'ANU': '8' }[temporality] || '0';

      const results = {
        success: true,
        uuaa,
        temporality,
        temporalityCode,
        totalJobs: jobs.length + 6, // jobs + secuencias automáticas
        mallas: {
          dataxDesarrollo: `CR-CO${uuaa}${temporality}-T04-DEV.xml`,
          dataxProduccion: `CR-CO${uuaa}${temporality}-T04-PROD.xml`,
          ingestaDesarrollo: `CR-CO${uuaa}${temporality}-T02-DEV.xml`,
          ingestaProduccion: `CR-CO${uuaa}${temporality}-T02-PROD.xml`
        },
        sequenceStats: {
          datax: { total: 1, transferencias: 1 },
          ingesta: { 
            total: jobs.length + 5,
            calidad: 4,
            borrado: 3,
            phases: { staging: 1, raw: 2, master: 2, masterL1T: 1 }
          }
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
    console.log(`Descargando malla ${type} de Control-M`);
  };

  const canGenerateControlM = xmlFiles.length === 2 && jobs.length > 0 && validationErrors.length === 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Control-M Generator</h2>
          <p className="text-sm text-gray-600">Mallas de orquestación</p>
        </div>
      </div>

      {/* XMLs Upload Section */}
      <InfoPanel title="XMLs Control-M" variant="info">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subir XMLs (1 T04 + 1 T02)
            </label>
            <input
              type="file"
              multiple
              accept=".xml"
              onChange={handleXMLUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Formato: CR-CO[UUAA][TEMPORALIDAD]-T0[TIPO].xml
            </p>
          </div>

          {xmlFiles.length > 0 && (
            <div className="space-y-2">
              {xmlFiles.map((xmlFile, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{xmlFile.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {xmlFile.type} • UUAA: {xmlFile.uuaa} • {xmlFile.temporality}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    xmlFile.type === 'T04' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {xmlFile.type === 'T04' ? 'Datax' : 'Ingesta'}
                  </span>
                </div>
              ))}
            </div>
          )}
      </InfoPanel>

      {/* Jobs List Section */}
      <InfoPanel 
        title="Lista de Jobs" 
        variant="neutral"
        className="relative"
      >
        <div className="absolute top-3 right-4">
          <Button onClick={addJob} size="sm" className="flex items-center">
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Job
          </Button>
        </div>
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay jobs agregados</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Nombre del job"
                      value={job.name}
                      onChange={(e) => updateJob(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={job.type}
                      onChange={(e) => updateJob(index, 'type', e.target.value as 'T04' | 'T02')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="datax">Datax</option>
                      <option value="kirby">Kirby</option>
                      <option value="hammurabi">Hammurabi</option>
                      <option value="smartcleaner">SmartCleaner</option>
                    </select>
                  </div>
                  <Button
                    onClick={() => removeJob(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
      </InfoPanel>

      {/* Datax Configuration */}
      <InfoPanel title="Configuración Datax" variant="neutral">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Periodicidad">
            <select
              value={dataxConfig.periodicity}
              onChange={(e) => setDataxConfig(prev => ({ ...prev, periodicity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </FormField>

          <FormField label="Hora de Inicio">
            <input
              type="time"
              value={dataxConfig.startTime}
              onChange={(e) => setDataxConfig(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Tipo de Periodicidad">
            <select
              value={dataxConfig.periodicityType}
              onChange={(e) => setDataxConfig(prev => ({ ...prev, periodicityType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="calendario">Calendario</option>
              <option value="habil">Hábil</option>
            </select>
          </FormField>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isCyclic"
              checked={dataxConfig.isCyclic}
              onChange={(e) => setDataxConfig(prev => ({ ...prev, isCyclic: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isCyclic" className="ml-2 text-sm text-gray-700">
              Job Cíclico
            </label>
          </div>

          {dataxConfig.isCyclic && (
            <FormField label="Intervalo (horas)">
              <input
                type="number"
                min="1"
                max="24"
                value={dataxConfig.intervalHours}
                onChange={(e) => setDataxConfig(prev => ({ ...prev, intervalHours: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          )}
        </div>
      </InfoPanel>

      {/* Nomenclature Info */}
      <InfoPanel title="Sistema de Nomenclatura CUUAAXYTZZZ" variant="info">
        <div className="flex items-start">
          <InformationCircleIcon className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
            <div><strong>C:</strong> País (Colombia)</div>
            <div><strong>UUAA:</strong> Unidad organizacional</div>
            <div><strong>X:</strong> Tipo (T=Transfer, C=Process, D=Delete)</div>
            <div><strong>Y:</strong> Ambiente (D=Dev, P=Prod)</div>
            <div><strong>T:</strong> Temporalidad (0=Diario, 1=Semanal, 4=Mensual, 8=Anual)</div>
            <div><strong>ZZZ:</strong> Secuencia (001, 002, 003...)</div>
          </div>
        </div>
      </InfoPanel>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <InfoPanel title="Errores de Validación" variant="warning">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mt-1 mr-3 flex-shrink-0" />
            <ul className="text-sm text-amber-800 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </InfoPanel>
      )}

      {/* Generation Controls */}
      <InfoPanel title="Controles de Generación" variant="neutral">
        <div className="flex items-center justify-between mb-4">
          <ReadOnlyWrapper fallbackMessage="Botón deshabilitado">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerateControlM || isGenerating}
              className="flex items-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando...' : 'Generar Mallas Control-M'}
            </Button>
          </ReadOnlyWrapper>
          
          {!canGenerateControlM && (
            <span className="text-sm text-red-600">
              Se requieren 2 XMLs válidos y al menos 1 job
            </span>
          )}
        </div>

        {isGenerating && (
          <div>
            <ProgressBar 
              progress={progress} 
              className="mb-2"
            />
            <p className="text-sm text-gray-600">Procesando mallas Control-M...</p>
          </div>
        )}
      </InfoPanel>

      {generationResults && (
        <InfoPanel title="Generación Completada" variant="success">
          <div className="flex items-center mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            <span className="text-sm text-green-800">Mallas generadas exitosamente</span>
          </div>

          {/* Statistics */}
          <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Estadísticas de Generación</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">UUAA:</span>
                <span className="ml-2 text-green-600">{generationResults.uuaa}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Temporalidad:</span>
                <span className="ml-2 text-green-600">{generationResults.temporality}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Jobs:</span>
                <span className="ml-2 text-green-600">{generationResults.totalJobs}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Mallas:</span>
                <span className="ml-2 text-green-600">4</span>
              </div>
            </div>
          </div>
          
          {/* Generated Meshes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Mallas Datax</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{generationResults.mallas.dataxDesarrollo}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadFile('datax-dev')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{generationResults.mallas.dataxProduccion}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadFile('datax-prod')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Mallas Ingesta</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{generationResults.mallas.ingestaDesarrollo}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadFile('ingesta-dev')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{generationResults.mallas.ingestaProduccion}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadFile('ingesta-prod')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
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