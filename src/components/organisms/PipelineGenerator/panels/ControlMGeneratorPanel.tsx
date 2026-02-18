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
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { ControlMGeneratorPanelProps } from '../types';


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
}: ControlMGeneratorPanelProps) => {
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
  const [currentStep, setCurrentStep] = useState<string>('');
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
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showConfigSection, setShowConfigSection] = useState(false);

  const validateXMLFile = async (file: File): Promise<{ type: 'T04' | 'T02' | null, temporality: string, uuaa: string, errors: string[] }> => {
    const errors: string[] = [];
    let type: 'T04' | 'T02' | null = null;
    let temporality = '';
    let uuaa = '';

    try {
      const content = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      const parseError = xmlDoc.getElementsByTagName('parsererror');

      if (parseError.length > 0) {
        errors.push('Archivo XML no válido');
        return { type, temporality, uuaa, errors };
      }

      const fileName = file.name;
      const match = fileName.match(/CR-CO([A-Z0-9]{3,4})(DIA|SEM|MEN|ANU)-T0([24])\.xml/i);

      if (!match) {
        errors.push('Nombre de archivo no sigue el patrón: CR-CO[UUAA][TEMPORALIDAD]-T0[TIPO].xml');
        return { type, temporality, uuaa, errors };
      }

      uuaa = match[1];
      temporality = match[2];
      type = match[3] === '4' ? 'T04' : 'T02';

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

    const t04Files = newXmlFiles.filter(f => f.type === 'T04');
    const t02Files = newXmlFiles.filter(f => f.type === 'T02');

    if (t04Files.length !== 1) {
      allErrors.push('Se requiere exactamente 1 archivo T04 (Datax)');
    }
    if (t02Files.length !== 1) {
      allErrors.push('Se requiere exactamente 1 archivo T02 (Ingesta)');
    }

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
        'Creando mallas Datax...',
        'Creando mallas Ingesta...',
        'Aplicando nomenclatura...',
        'Finalizando...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setProgress(((i + 1) / steps.length) * 100);
      }

      const uuaa = xmlFiles[0].uuaa;
      const temporality = xmlFiles[0].temporality;
      const temporalityCode = { 'DIA': '0', 'SEM': '1', 'MEN': '4', 'ANU': '8' }[temporality] || '0';

      const results = {
        success: true,
        uuaa,
        temporality,
        temporalityCode,
        totalJobs: jobs.length + 6,
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
      {/* Generation Control Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerateControlM || isGenerating}
            className="flex items-center"
            variant="primary"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Generar'}
          </Button>

          {!canGenerateControlM && (
            <span className="text-sm text-gray-500">
              Requiere 2 XMLs válidos y al menos 1 job
            </span>
          )}

          {generationResults && !isGenerating && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
              4 mallas generadas
            </div>
          )}
        </div>

        {/* Info Tooltip - Nomenclature */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowInfoTooltip(true)}
            onMouseLeave={() => setShowInfoTooltip(false)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="Nomenclatura"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </button>
          {showInfoTooltip && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
              <h4 className="font-medium text-gray-900 text-sm mb-2">Nomenclatura CUUAAXYTZZZ</h4>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                <div><span className="font-medium">C:</span> País</div>
                <div><span className="font-medium">UUAA:</span> Unidad org.</div>
                <div><span className="font-medium">X:</span> Tipo (T/C/D)</div>
                <div><span className="font-medium">Y:</span> Ambiente (D/P)</div>
                <div><span className="font-medium">T:</span> Temporalidad</div>
                <div><span className="font-medium">ZZZ:</span> Secuencia</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mb-6">
          <ProgressBar progress={progress} className="mb-2" />
          <p className="text-sm text-gray-500">{currentStep || 'Iniciando...'}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
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
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Mallas Generadas ({generationResults.uuaa} - {generationResults.temporality})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Datax Column */}
            <div className="p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Datax</h4>
              <div className="space-y-2">
                {[
                  { name: generationResults.mallas.dataxDesarrollo, key: 'datax-dev' },
                  { name: generationResults.mallas.dataxProduccion, key: 'datax-prod' }
                ].map((malla) => (
                  <div key={malla.key} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group">
                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">{malla.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadFile(malla.key)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Ver contenido"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(malla.key)}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Ingesta Column */}
            <div className="p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Ingesta</h4>
              <div className="space-y-2">
                {[
                  { name: generationResults.mallas.ingestaDesarrollo, key: 'ingesta-dev' },
                  { name: generationResults.mallas.ingestaProduccion, key: 'ingesta-prod' }
                ].map((malla) => (
                  <div key={malla.key} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group">
                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">{malla.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadFile(malla.key)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Ver contenido"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(malla.key)}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Descargar"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Sections - Collapsible style */}
      <div className="space-y-4">
        {/* XMLs Upload */}
        <div className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">XMLs Control-M</span>
            {xmlFiles.length === 2 && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="p-4">
            <input
              type="file"
              multiple
              accept=".xml"
              onChange={handleXMLUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
            />
            <p className="text-xs text-gray-500 mb-3">Formato: CR-CO[UUAA][TEMPORALIDAD]-T0[TIPO].xml (1 T04 + 1 T02)</p>

            {xmlFiles.length > 0 && (
              <div className="space-y-2">
                {xmlFiles.map((xmlFile, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">{xmlFile.file.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded ${xmlFile.type === 'T04' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                      {xmlFile.type === 'T04' ? 'Datax' : 'Ingesta'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Jobs List */}
        <div className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Jobs ({jobs.length})</span>
            <Button onClick={addJob} size="sm" variant="outline" className="flex items-center text-xs">
              <PlusIcon className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>
          <div className="p-4">
            {jobs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">No hay jobs agregados</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del job"
                      value={job.name}
                      onChange={(e) => updateJob(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={job.type}
                      onChange={(e) => updateJob(index, 'type', e.target.value as JobEntry['type'])}
                      className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="datax">Datax</option>
                      <option value="kirby">Kirby</option>
                      <option value="hammurabi">Hammurabi</option>
                      <option value="smartcleaner">SmartCleaner</option>
                    </select>
                    <button
                      onClick={() => removeJob(index)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Datax Config - Collapsible */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowConfigSection(!showConfigSection)}
            className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-gray-700">Configuración Datax</span>
            <span className="text-xs text-gray-500">{showConfigSection ? '▲' : '▼'}</span>
          </button>
          {showConfigSection && (
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Periodicidad</label>
                <select
                  value={dataxConfig.periodicity}
                  onChange={(e) => setDataxConfig(prev => ({ ...prev, periodicity: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={dataxConfig.startTime}
                  onChange={(e) => setDataxConfig(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <select
                  value={dataxConfig.periodicityType}
                  onChange={(e) => setDataxConfig(prev => ({ ...prev, periodicityType: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="calendario">Calendario</option>
                  <option value="habil">Hábil</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCyclic"
                  checked={dataxConfig.isCyclic}
                  onChange={(e) => setDataxConfig(prev => ({ ...prev, isCyclic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isCyclic" className="ml-2 text-sm text-gray-700">Cíclico</label>
              </div>

              {dataxConfig.isCyclic && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Intervalo (hrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dataxConfig.intervalHours}
                    onChange={(e) => setDataxConfig(prev => ({ ...prev, intervalHours: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};