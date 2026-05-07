'use client';

import { useState, useEffect } from 'react';
import {
  PlayIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentPlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { usePipelineGeneratorService } from '@/services/PipelineGenerator';

interface ControlMFlowProps {
  objectId: string;
  readOnly?: boolean;
}

interface IngestaJob {
  name: string;
  generator: 'kirby' | 'hammurabi' | 'smartcleaner';
  phase: 'staging' | 'raw' | 'master' | 'master-l1t';
  type: 'ingesta' | 'borrado';
}

interface ControlMJob {
  jobName: string;
  type: 'T' | 'C' | 'D' | 'W';
  description: string;
  phase: string;
  originalJob?: string;
  order: number;
}

interface DataxConfig {
  periodicity: 'diario' | 'semanal' | 'mensual' | 'anual';
  periodicityType: 'calendario' | 'habil';
  startTime: string;
  timezone: string;
  isCyclic: boolean;
  intervalHours: number;
  monthDay: number;
  weekDay: number;
  businessDayDirection: 'D' | 'L';
  businessDayNumber: number;
  annualMonth: number;
  annualDay: number;
}

const TEMPORALIDAD_CODES: Record<string, string> = {
  'diario': '0',
  'semanal': '1',
  'mensual': '4',
  'anual': '8'
};

export const ControlMFlow = ({ objectId }: ControlMFlowProps) => {
  // Trigger type: datax o filewatcher
  const [triggerType, setTriggerType] = useState<'datax' | 'filewatcher'>('datax');
  const [alias, setAlias] = useState('');
  const [stagingPath, setStagingPath] = useState('');

  // Estados para inputs
  const [transferName, setTransferName] = useState('');
  const [uuaa, setUuaa] = useState('');
  const [xmlOriginalUuaa, setXmlOriginalUuaa] = useState<string | null>(null); // UUAA from existing XML (3 or 4 chars)
  const [ingestaJobs, setIngestaJobs] = useState<IngestaJob[]>([]);
  const [hasL1T, setHasL1T] = useState(false);

  // Configuracion Datax
  const [dataxConfig, setDataxConfig] = useState<DataxConfig>({
    periodicity: 'diario',
    periodicityType: 'calendario',
    startTime: '02:00',
    timezone: 'GMT-5',
    isCyclic: false,
    intervalHours: 4,
    monthDay: 1,
    weekDay: 6,
    businessDayDirection: 'D',
    businessDayNumber: 1,
    annualMonth: 1,
    annualDay: 1
  });

  // Particiones del schema raw (para que el backend derive las variables SENTRY_PARM)
  const [schemaPartitions, setSchemaPartitions] = useState<string[]>([]);

  // Mallas existentes (modo aditivo)
  const [existingT04Xml, setExistingT04Xml] = useState<string | null>(null);
  const [existingT02Xml, setExistingT02Xml] = useState<string | null>(null);
  const [existingT04FileName, setExistingT04FileName] = useState<string>('');
  const [existingT02FileName, setExistingT02FileName] = useState<string>('');
  const [nextSequences, setNextSequences] = useState<{ T: number; C: number; D: number } | null>(null);
  const [isAnalyzingXml, setIsAnalyzingXml] = useState(false);

  // Estados de descarga
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Estados de generacion
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedJobs, setGeneratedJobs] = useState<ControlMJob[]>([]);
  const [generatedMallas, setGeneratedMallas] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [s3Urls, setS3Urls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [uuaaMismatchWarning, setUuaaMismatchWarning] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);

  const pipelineService = usePipelineGeneratorService();

  // Cargar artefactos Control-M previamente generados al montar
  useEffect(() => {
    const loadExistingControlMArtifacts = async () => {
      if (!objectId) return;

      try {
        const response = await pipelineService.getGeneratedArtifacts(objectId);
        const controlmArtifact = response.artifacts.controlm;

        if (controlmArtifact?.artifacts_data) {
          const data = controlmArtifact.artifacts_data;

          // Restaurar jobs generados
          if (data.jobs_sequence && data.jobs_sequence.length > 0) {
            setGeneratedJobs(data.jobs_sequence.map(j => ({
              jobName: j.jobName,
              type: j.type,
              description: j.description,
              phase: j.phase,
              originalJob: j.originalJob,
              order: j.order
            })));
          }

          // Restaurar mallas generadas
          if (data.mallas && data.mallas.length > 0) {
            setGeneratedMallas(data.mallas);
          }

          // Restaurar URLs de S3
          if (controlmArtifact.s3_urls) {
            setS3Urls(controlmArtifact.s3_urls);
          }

          // Restaurar configuración
          if (data.config) {
            if (data.config.uuaa) setUuaa(data.config.uuaa);
            if (data.config.transfer_name) setTransferName(data.config.transfer_name);
          }
        }
      } catch {
        // Si no hay artefactos, no es un error - simplemente no se ha generado aún
      }
    };

    loadExistingControlMArtifacts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectId]);


  // Cargar jobs desde Pipeline Generator
  const loadJobsFromPipelineGenerator = async () => {
    if (!objectId) return;

    setIsLoadingArtifacts(true);
    setError(null);

    try {
      const response = await pipelineService.getGeneratedArtifacts(objectId);
      const artifacts = response.artifacts;
      const jobs: IngestaJob[] = [];

      // Extraer particiones desde el artefacto de schemas (raw o master).
      // Sirven al backend para derivar variables YEAR/MONTH/DAY/CUTOFF_DATE
      // del SENTRY_PARM segun el nombre real de las particiones del schema.
      const schemasData = artifacts.schemas?.artifacts_data;
      const rawPartitions = (schemasData?.raw_schema_data as { partitions?: string[] } | undefined)?.partitions;
      const masterPartitions = (schemasData?.master_schema_data as { partitions?: string[] } | undefined)?.partitions;
      const detectedPartitions = rawPartitions && rawPartitions.length > 0 ? rawPartitions : (masterPartitions ?? []);
      setSchemaPartitions(detectedPartitions);

      // Extraer UUAA del primer job encontrado o del metadata
      let extractedUuaa = '';

      // Intentar extraer UUAA y datos para FileWatcher del metadata
      if (artifacts.kirby?.artifacts_data?.metadata?.extractedInfo) {
        const extractedInfo = artifacts.kirby.artifacts_data.metadata.extractedInfo;
        const metadata = artifacts.kirby.artifacts_data.metadata;
        const namespace = extractedInfo.namespace || '';
        const extractedAlias = extractedInfo.alias || '';
        const uuaaMatch = namespace.match(/([a-z]{3,4})\.co\./i);
        if (uuaaMatch) {
          extractedUuaa = uuaaMatch[1].toLowerCase();
        }
        // Auto-fill FileWatcher fields
        if (extractedAlias) {
          setAlias(extractedAlias);
        }
        // Extraer staging path: primero del raw config (fuente de verdad), luego de metadata como fallback
        if (artifacts.kirby.artifacts_data.configs?.raw?.content) {
          const rawContent = artifacts.kirby.artifacts_data.configs.raw.content;
          const pathMatch = rawContent.match(/paths\s*=\s*\[\s*[\n\r]?\s*(.+?)\s*[\n\r]?\s*\]/);
          if (pathMatch) {
            const rawPath = pathMatch[1].replace(/"/g, '').trim();
            setStagingPath(rawPath);
          } else if (metadata.stagingInputPath) {
            setStagingPath(metadata.stagingInputPath);
          }
        } else if (metadata.stagingInputPath) {
          setStagingPath(metadata.stagingInputPath);
        }
      }

      // Procesar Kirby - extraer nombres de jobs del artifacts_data.jobs
      if (artifacts.kirby?.artifacts_data?.jobs) {
        const kirbyJobFiles = Object.values(artifacts.kirby.artifacts_data.jobs) as Array<{ file_name: string }>;
        const kirbyJobNames = kirbyJobFiles.map(f => f.file_name?.replace(/\.(conf|json|yml|yaml)$/i, '') || '').filter(Boolean);
        const kirbyJobs = extractJobsFromNames(kirbyJobNames, 'kirby');
        jobs.push(...kirbyJobs);
        if (kirbyJobs.length > 0 && !extractedUuaa) {
          extractedUuaa = extractUuaaFromJobName(kirbyJobs[0].name);
        }
      }

      // Procesar Hammurabi
      if (artifacts.hammurabi?.artifacts_data?.jobs) {
        const hammurabiJobFiles = Object.values(artifacts.hammurabi.artifacts_data.jobs) as Array<{ file_name: string }>;
        const hammurabiJobNames = hammurabiJobFiles.map(f => f.file_name?.replace(/\.(conf|json|yml|yaml)$/i, '') || '').filter(Boolean);
        const hammurabiJobs = extractJobsFromNames(hammurabiJobNames, 'hammurabi');
        jobs.push(...hammurabiJobs);
        if (hammurabiJobs.length > 0 && !extractedUuaa) {
          extractedUuaa = extractUuaaFromJobName(hammurabiJobs[0].name);
        }
      }

      // Procesar SmartCleaner
      if (artifacts.smartcleaner?.artifacts_data?.jobs) {
        const smartcleanerJobFiles = Object.values(artifacts.smartcleaner.artifacts_data.jobs) as Array<{ file_name: string }>;
        const smartcleanerJobNames = smartcleanerJobFiles.map(f => f.file_name?.replace(/\.(conf|json|yml|yaml)$/i, '') || '').filter(Boolean);
        const smartcleanerJobs = extractJobsFromNames(smartcleanerJobNames, 'smartcleaner');
        jobs.push(...smartcleanerJobs);
        if (smartcleanerJobs.length > 0 && !extractedUuaa) {
          extractedUuaa = extractUuaaFromJobName(smartcleanerJobs[0].name);
        }
      }

      // Detectar si hay L1T
      const hasL1TJobs = jobs.some(job => job.phase === 'master-l1t');
      setHasL1T(hasL1TJobs);


      if (extractedUuaa) {
        setUuaa(extractedUuaa);
      }

      setIngestaJobs(jobs);

      if (jobs.length === 0) {
        setError('No se encontraron jobs en Pipeline Generator. Genera primero los componentes Kirby, Hammurabi y SmartCleaner.');
      }

    } catch {
      setError('No se encontraron artefactos de Pipeline Generator. Genera primero los componentes.');
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Extraer jobs desde los nombres de jobs guardados
  const extractJobsFromNames = (jobNames: string[], generator: 'kirby' | 'hammurabi' | 'smartcleaner'): IngestaJob[] => {
    const jobs: IngestaJob[] = [];

    for (const jobName of jobNames) {
      const nameLower = jobName.toLowerCase();
      let phase: IngestaJob['phase'] = 'raw';
      const type: IngestaJob['type'] = generator === 'smartcleaner' ? 'borrado' : 'ingesta';

      // Determinar fase basado en el nombre del job
      if (generator === 'kirby') {
        // Kirby: uuaa-co-krb-inr-alias-01 (raw), uuaa-co-krb-inm-alias-01 (master), uuaa-co-krb-inm-l1talias-01 (l1t)
        if (nameLower.includes('-inm-l1t')) {
          phase = 'master-l1t';
        } else if (nameLower.includes('-inm-')) {
          phase = 'master';
        } else if (nameLower.includes('-inr-')) {
          phase = 'raw';
        }
      } else if (generator === 'hammurabi') {
        // Hammurabi: uuaa-co-hmm-qlt-aliass-01 (staging), aliasr-01 (raw), aliasm-01 (master), l1taliasm-01 (l1t)
        if (nameLower.includes('-qlt-l1t')) {
          phase = 'master-l1t';
        } else if (nameLower.match(/-qlt-[a-z0-9]+s-\d+$/)) {
          phase = 'staging';
        } else if (nameLower.match(/-qlt-[a-z0-9]+r-\d+$/)) {
          phase = 'raw';
        } else if (nameLower.match(/-qlt-[a-z0-9]+m-\d+$/)) {
          phase = 'master';
        }
      } else if (generator === 'smartcleaner') {
        // SmartCleaner: uuaa-co-dfs-rmv-smcaliasr-01 (raw), smcaliasm-01 (master), smcl1taliasm-01 (l1t)
        if (nameLower.includes('-rmv-smcl1t')) {
          phase = 'master-l1t';
        } else if (nameLower.match(/-rmv-smc[a-z0-9]+r-\d+$/)) {
          phase = 'raw';
        } else if (nameLower.match(/-rmv-smc[a-z0-9]+m-\d+$/)) {
          phase = 'master';
        }
      }

      // Evitar duplicados
      if (!jobs.some(j => j.name === jobName)) {
        jobs.push({ name: jobName, generator, phase, type });
      }
    }

    return jobs;
  };

  // Extraer UUAA del nombre del job
  const extractUuaaFromJobName = (jobName: string): string => {
    const match = jobName.match(/^([a-z0-9]{3,4})-co-/i);
    return match ? match[1].toLowerCase() : '';
  };

  // Manejar carga de archivo XML existente
  const handleXmlFileUpload = async (file: File, type: 't04' | 't02') => {
    try {
      const content = await file.text();

      if (type === 't04') {
        setExistingT04Xml(content);
        setExistingT04FileName(file.name);
      } else {
        setExistingT02Xml(content);
        setExistingT02FileName(file.name);
      }

      // Analyze sequences when both XMLs are loaded (or just one)
      const t04 = type === 't04' ? content : existingT04Xml;
      const t02 = type === 't02' ? content : existingT02Xml;

      if (t04 || t02) {
        await analyzeExistingSequences(t04, t02);
      }
    } catch (err) {
      setError(`Error al leer archivo XML: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Analizar secuencias existentes en XMLs
  const analyzeExistingSequences = async (t04Xml: string | null, t02Xml: string | null) => {
    // No XMLs to analyze
    if (!t04Xml && !t02Xml) return;

    setIsAnalyzingXml(true);
    try {
      const temporalidadCode = TEMPORALIDAD_CODES[dataxConfig.periodicity];
      const response = await pipelineService.analyzeControlMSequences({
        t04_xml: t04Xml || undefined,
        t02_xml: t02Xml || undefined,
        uuaa: uuaa, // Can be empty - backend extracts from XML folder name
        temporality_code: temporalidadCode // Fallback - backend extracts from XML folder name
      });

      setNextSequences(response.next_sequences);

      // Extract UUAA from folder info
      const folderInfo = response.folder_info;
      const xmlUuaa = (folderInfo.t04?.normalizedUuaa || folderInfo.t02?.normalizedUuaa || '').toLowerCase();
      // Store original UUAA from XML (3 or 4 chars) for job name generation
      const originalXmlUuaa = (folderInfo.t04?.uuaa || folderInfo.t02?.uuaa || '').toUpperCase();
      setXmlOriginalUuaa(originalXmlUuaa || null);

      if (!uuaa) {
        // Auto-fill if empty
        if (xmlUuaa) setUuaa(xmlUuaa);
        setUuaaMismatchWarning(null);
      } else if (xmlUuaa) {
        // Compare XML UUAA with current UUAA and job names
        const mismatches: string[] = [];
        const currentUuaa = uuaa.toLowerCase();
        const xmlUuaaNorm = xmlUuaa.toLowerCase();

        if (currentUuaa !== xmlUuaaNorm) {
          mismatches.push(`Datax UUAA "${uuaa}" vs XML "${xmlUuaa}"`);
        }

        // Check job names UUAAs
        const jobUuaas = new Set(
          ingestaJobs
            .map(j => extractUuaaFromJobName(j.name))
            .filter(Boolean)
        );
        for (const jobUuaa of jobUuaas) {
          if (jobUuaa.toLowerCase() !== xmlUuaaNorm) {
            mismatches.push(`Jobs Dataproc "${jobUuaa}" vs XML "${xmlUuaa}"`);
            break;
          }
        }

        setUuaaMismatchWarning(
          mismatches.length > 0
            ? `UUAA distinta detectada en las mallas XML: ${mismatches.join('; ')}`
            : null
        );
      }
    } catch {
    } finally {
      setIsAnalyzingXml(false);
    }
  };

  // Eliminar XML existente
  const removeExistingXml = (type: 't04' | 't02') => {
    if (type === 't04') {
      setExistingT04Xml(null);
      setExistingT04FileName('');
    } else {
      setExistingT02Xml(null);
      setExistingT02FileName('');
    }

    // Re-analyze if the other XML still exists
    const remaining = type === 't04' ? existingT02Xml : existingT04Xml;
    if (remaining) {
      analyzeExistingSequences(
        type === 't04' ? null : existingT04Xml,
        type === 't02' ? null : existingT02Xml
      );
    } else {
      setNextSequences(null);
      setXmlOriginalUuaa(null);
      setUuaaMismatchWarning(null);
    }
  };

  const isAdditiveMode = Boolean(existingT04Xml || existingT02Xml);

  // Normalizar UUAA (3 letras -> 4 letras agregando 'c')
  const normalizeUuaa = (uuaa: string): string => {
    const normalized = uuaa.toLowerCase();
    if (normalized.length === 3) {
      return 'c' + normalized;
    }
    return normalized;
  };

  // Generar nombre de job Control-M
  const generateControlMJobName = (
    uuaa: string,
    jobType: 'T' | 'C' | 'D' | 'W',
    environment: 'D' | 'P',
    temporalidadCode: string,
    sequence: number
  ): string => {
    const sequenceStr = sequence.toString().padStart(3, '0');
    return `C${uuaa.toUpperCase()}${jobType}${environment}${temporalidadCode}${sequenceStr}`;
  };

  // Generar secuencia de jobs Control-M
  const generateControlMSequence = (): ControlMJob[] => {
    const jobs: ControlMJob[] = [];
    // In additive mode xmlOriginalUuaa is set; in new mode normalize to 4 chars
    const jobUuaa = xmlOriginalUuaa || normalizeUuaa(uuaa).toUpperCase();
    const temporalidadCode = TEMPORALIDAD_CODES[dataxConfig.periodicity];

    // Use next available sequences from analysis (additive mode) or start from 1
    let tSequence = nextSequences?.T ?? 1;
    let cSequence = nextSequences?.C ?? 1;
    let dSequence = nextSequences?.D ?? 1;
    let order = 1;

    // 1. Job iniciador: Datax o FileWatcher
    if (triggerType === 'filewatcher') {
      const wSequence = nextSequences?.T ?? 1;
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'W', 'D', temporalidadCode, wSequence),
        type: 'W',
        description: `Job de validacion de la existencia del archivo de ${alias}`,
        phase: 'filewatcher',
        originalJob: stagingPath,
        order: order++
      });
    } else {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'T', 'D', temporalidadCode, tSequence++),
        type: 'T',
        description: `Transferencia Datax ${transferName}`,
        phase: 'datax',
        originalJob: transferName,
        order: order++
      });
    }

    // 2. Hammurabi Staging (calidad)
    const hammurabiStaging = ingestaJobs.find(j => j.generator === 'hammurabi' && j.phase === 'staging');
    if (hammurabiStaging) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
        type: 'C',
        description: `Calidad de datos en fase Staging - ${alias}`,
        phase: 'staging',
        originalJob: hammurabiStaging.name,
        order: order++
      });
    }

    // 3. Kirby Raw (ingesta)
    const kirbyRaw = ingestaJobs.find(j => j.generator === 'kirby' && j.phase === 'raw');
    if (kirbyRaw) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
        type: 'C',
        description: `Ingesta de datos en fase Raw - ${alias}`,
        phase: 'raw',
        originalJob: kirbyRaw.name,
        order: order++
      });
    }

    // 4. Hammurabi Raw (calidad)
    const hammurabiRaw = ingestaJobs.find(j => j.generator === 'hammurabi' && j.phase === 'raw');
    if (hammurabiRaw) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
        type: 'C',
        description: `Calidad de datos en fase Raw - ${alias}`,
        phase: 'raw',
        originalJob: hammurabiRaw.name,
        order: order++
      });
    }

    // 5. Kirby Master (ingesta)
    const kirbyMaster = ingestaJobs.find(j => j.generator === 'kirby' && j.phase === 'master');
    if (kirbyMaster) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
        type: 'C',
        description: `Ingesta de datos en fase Master - ${alias}`,
        phase: 'master',
        originalJob: kirbyMaster.name,
        order: order++
      });
    }

    // 6. Hammurabi Master (calidad)
    const hammurabiMaster = ingestaJobs.find(j => j.generator === 'hammurabi' && j.phase === 'master');
    if (hammurabiMaster) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
        type: 'C',
        description: `Calidad de datos en fase Master - ${alias}`,
        phase: 'master',
        originalJob: hammurabiMaster.name,
        order: order++
      });
    }

    // 7-8. L1T si existe
    if (hasL1T) {
      const kirbyL1T = ingestaJobs.find(j => j.generator === 'kirby' && j.phase === 'master-l1t');
      if (kirbyL1T) {
        jobs.push({
          jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
          type: 'C',
          description: `Ingesta de datos en fase Master L1T - ${alias}`,
          phase: 'master-l1t',
          originalJob: kirbyL1T.name,
          order: order++
        });
      }

      const hammurabiL1T = ingestaJobs.find(j => j.generator === 'hammurabi' && j.phase === 'master-l1t');
      if (hammurabiL1T) {
        jobs.push({
          jobName: generateControlMJobName(jobUuaa, 'C', 'D', temporalidadCode, cSequence++),
          type: 'C',
          description: `Calidad de datos en fase Master L1T - ${alias}`,
          phase: 'master-l1t',
          originalJob: hammurabiL1T.name,
          order: order++
        });
      }
    }

    // 9. Borrado Staging
    jobs.push({
      jobName: generateControlMJobName(jobUuaa, 'D', 'D', temporalidadCode, dSequence++),
      type: 'D',
      description: `Borrado de input en fase Staging - ${alias}`,
      phase: 'staging',
      originalJob: `${uuaa}-co-dfs-rmv-hdfs-01`,
      order: order++
    });

    // 10. SmartCleaner Raw (borrado)
    const smartcleanerRaw = ingestaJobs.find(j => j.generator === 'smartcleaner' && j.phase === 'raw');
    if (smartcleanerRaw) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'D', 'D', temporalidadCode, dSequence++),
        type: 'D',
        description: `Borrado de datos en fase Raw - ${alias}`,
        phase: 'raw',
        originalJob: smartcleanerRaw.name,
        order: order++
      });
    }

    // 11. SmartCleaner Master (borrado)
    const smartcleanerMaster = ingestaJobs.find(j => j.generator === 'smartcleaner' && j.phase === 'master');
    if (smartcleanerMaster) {
      jobs.push({
        jobName: generateControlMJobName(jobUuaa, 'D', 'D', temporalidadCode, dSequence++),
        type: 'D',
        description: `Borrado de datos en fase Master - ${alias}`,
        phase: 'master',
        originalJob: smartcleanerMaster.name,
        order: order++
      });
    }

    // 12. SmartCleaner L1T (borrado) si existe
    if (hasL1T) {
      const smartcleanerL1T = ingestaJobs.find(j => j.generator === 'smartcleaner' && j.phase === 'master-l1t');
      if (smartcleanerL1T) {
        jobs.push({
          jobName: generateControlMJobName(jobUuaa, 'D', 'D', temporalidadCode, dSequence++),
          type: 'D',
          description: `Borrado de datos en fase Master L1T - ${alias}`,
          phase: 'master-l1t',
          originalJob: smartcleanerL1T.name,
          order: order++
        });
      }
    }

    return jobs;
  };

  // Generar mallas
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const steps = [
        'Validando configuracion...',
        'Analizando jobs de ingesta...',
        'Generando secuencia de jobs...',
        'Guardando en S3...',
        'Finalizando...'
      ];

      // Paso 1-3: Generar secuencia
      for (let i = 0; i < 3; i++) {
        setCurrentStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(((i + 1) / steps.length) * 100);
      }

      const jobs = generateControlMSequence();
      setGeneratedJobs(jobs);

      // Paso 4: Guardar en S3
      setCurrentStep(steps[3]);
      setProgress(80);

      // Llamar al API para guardar en S3
      const response = await pipelineService.generateControlM({
        object_id: objectId,
        jobsList: ingestaJobs.map(j => ({ name: j.name, type: j.generator })),
        componentType: 'tabla',
        dataxConfig: {
          periodicity: dataxConfig.periodicity,
          periodicityType: dataxConfig.periodicityType,
          startTime: dataxConfig.startTime,
          timezone: dataxConfig.timezone,
          isCyclic: dataxConfig.isCyclic,
          intervalHours: dataxConfig.intervalHours,
          monthDay: dataxConfig.monthDay,
          weekDay: dataxConfig.weekDay,
          businessDayDirection: dataxConfig.businessDayDirection,
          businessDayNumber: dataxConfig.businessDayNumber,
          annualMonth: dataxConfig.annualMonth,
          annualDay: dataxConfig.annualDay
        },
        uuaa: uuaa,
        transferName: triggerType === 'datax' ? transferName : undefined,
        triggerType: triggerType,
        alias: triggerType === 'filewatcher' ? alias : undefined,
        stagingPath: stagingPath || undefined,
        generatedJobs: jobs.map(j => ({
          jobName: j.jobName,
          type: j.type,
          description: j.description,
          phase: j.phase,
          originalJob: j.originalJob,
          order: j.order
        })),
        existingT04Xml: triggerType === 'datax' ? (existingT04Xml || undefined) : undefined,
        existingT02Xml: existingT02Xml || undefined,
        partitions: schemaPartitions.length > 0 ? schemaPartitions : undefined,
      });

      if (!response.success) {
      } else {
        // Store generated mallas and S3 URLs
        if (response.data?.mallas) {
          setGeneratedMallas(response.data.mallas);
        }
        if (response.s3_urls) {
          setS3Urls(response.s3_urls);
        }
      }

      // Paso 5: Finalizar
      setCurrentStep(steps[4]);
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la generacion');
    } finally {
      setIsGenerating(false);
    }
  };

  // Descargar malla XML
  const handleDownloadMalla = async (fileName: string) => {
    setDownloadingFile(fileName);
    try {
      await pipelineService.downloadArtifactFile(objectId, 'controlm', fileName);
    } catch {
      setError(`Error al descargar ${fileName}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  // Descargar documentación completa como ZIP
  const handleDownloadDocsZip = async () => {
    setDownloadingFile('docs-zip');
    try {
      await pipelineService.downloadControlMDocsZip(objectId);
    } catch {
      setError('Error al descargar documentación');
    } finally {
      setDownloadingFile(null);
    }
  };

  // Agregar job manualmente
  const addManualJob = () => {
    setIngestaJobs([...ingestaJobs, {
      name: '',
      generator: 'kirby',
      phase: 'raw',
      type: 'ingesta'
    }]);
  };

  const updateJob = (index: number, field: keyof IngestaJob, value: string) => {
    const newJobs = [...ingestaJobs];
    newJobs[index] = { ...newJobs[index], [field]: value } as IngestaJob;

    // Actualizar tipo basado en generador
    if (field === 'generator') {
      newJobs[index].type = value === 'smartcleaner' ? 'borrado' : 'ingesta';
    }

    setIngestaJobs(newJobs);
  };

  const removeJob = (index: number) => {
    setIngestaJobs(ingestaJobs.filter((_, i) => i !== index));
  };

  // En modo aditivo, UUAA puede venir del XML; en modo normal es requerida
  const canGenerate = triggerType === 'filewatcher'
    ? stagingPath.trim() !== '' && uuaa.trim() !== '' && ingestaJobs.length > 0
    : transferName.trim() !== '' && uuaa.trim() !== '' && ingestaJobs.length > 0;

  const getJobTypeColor = (type: 'T' | 'C' | 'D' | 'W') => {
    switch (type) {
      case 'T': return 'bg-blue-100 text-blue-700';
      case 'W': return 'bg-amber-100 text-amber-700';
      case 'C': return 'bg-green-100 text-green-700';
      case 'D': return 'bg-red-100 text-red-700';
    }
  };

  const getJobTypeLabel = (type: 'T' | 'C' | 'D' | 'W') => {
    switch (type) {
      case 'T': return 'Transferencia';
      case 'W': return 'FileWatcher';
      case 'C': return 'Ingesta';
      case 'D': return 'Borrado';
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-medium text-gray-900">Control-M</h3>
          </div>
          {isAdditiveMode && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              Modo Aditivo
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Layout en 2 columnas: Datax + Jobs */}
          <div className="grid grid-cols-2 gap-6">
            {/* Columna izquierda: Configuracion */}
            <div className="pr-6 border-r border-gray-200">
              {/* Trigger Type Selector */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-500 font-medium">Iniciador:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="triggerType"
                    value="datax"
                    checked={triggerType === 'datax'}
                    onChange={() => setTriggerType('datax')}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">Datax</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="triggerType"
                    value="filewatcher"
                    checked={triggerType === 'filewatcher'}
                    onChange={() => setTriggerType('filewatcher')}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">FileWatcher</span>
                </label>
              </div>

              <div className="text-xs text-gray-500 mb-2 font-medium">
                {triggerType === 'datax' ? 'Configuracion Datax' : 'Configuracion FileWatcher'}
              </div>
              <div className="space-y-3">
                {triggerType === 'datax' ? (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Transferencia *</label>
                    <input
                      type="text"
                      placeholder="yyyy_dataxmovimientos_1"
                      value={transferName}
                      onChange={(e) => setTransferName(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ruta staging {stagingPath && <span className="text-green-600">✓</span>}</label>
                    <input
                      type="text"
                      placeholder="Se autocompleta al cargar jobs de Pipeline Generator"
                      value={stagingPath}
                      onChange={(e) => setStagingPath(e.target.value)}
                      className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8 ${
                        stagingPath ? 'border-green-300 bg-green-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                )}
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Periodicidad</label>
                    <select
                      value={dataxConfig.periodicity}
                      onChange={(e) => setDataxConfig(prev => ({ ...prev, periodicity: e.target.value as DataxConfig['periodicity'] }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                    >
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensual">Mensual</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  {(dataxConfig.periodicity === 'diario' || dataxConfig.periodicity === 'mensual') && (
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                      <select
                        value={dataxConfig.periodicityType}
                        onChange={(e) => setDataxConfig(prev => ({ ...prev, periodicityType: e.target.value as 'calendario' | 'habil' }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                      >
                        <option value="calendario">Calendario</option>
                        <option value="habil">Hábil</option>
                      </select>
                    </div>
                  )}
                  {dataxConfig.periodicity === 'mensual' && dataxConfig.periodicityType === 'calendario' && (
                    <div className="w-16">
                      <label className="block text-xs text-gray-500 mb-1">Día</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dataxConfig.monthDay}
                        onChange={(e) => setDataxConfig(prev => ({ ...prev, monthDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8 text-center"
                      />
                    </div>
                  )}
                  {dataxConfig.periodicity === 'mensual' && dataxConfig.periodicityType === 'habil' && (
                    <>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                        <select
                          value={dataxConfig.businessDayDirection}
                          onChange={(e) => setDataxConfig(prev => ({ ...prev, businessDayDirection: e.target.value as 'D' | 'L' }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                        >
                          <option value="D">Inicio mes</option>
                          <option value="L">Fin mes</option>
                        </select>
                      </div>
                      <div className="w-16">
                        <label className="block text-xs text-gray-500 mb-1">Día hábil</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={dataxConfig.businessDayNumber}
                          onChange={(e) => setDataxConfig(prev => ({ ...prev, businessDayNumber: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8 text-center"
                        />
                      </div>
                    </>
                  )}
                  {dataxConfig.periodicity === 'semanal' && (
                    <div className="w-20">
                      <label className="block text-xs text-gray-500 mb-1">Día</label>
                      <select
                        value={dataxConfig.weekDay}
                        onChange={(e) => setDataxConfig(prev => ({ ...prev, weekDay: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                      >
                        <option value={1}>Lun</option>
                        <option value={2}>Mar</option>
                        <option value={3}>Mié</option>
                        <option value={4}>Jue</option>
                        <option value={5}>Vie</option>
                        <option value={6}>Sáb</option>
                        <option value={0}>Dom</option>
                      </select>
                    </div>
                  )}
                  {dataxConfig.periodicity === 'anual' && (
                    <>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">Mes</label>
                        <select
                          value={dataxConfig.annualMonth}
                          onChange={(e) => setDataxConfig(prev => ({ ...prev, annualMonth: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                        >
                          <option value={1}>Ene</option>
                          <option value={2}>Feb</option>
                          <option value={3}>Mar</option>
                          <option value={4}>Abr</option>
                          <option value={5}>May</option>
                          <option value={6}>Jun</option>
                          <option value={7}>Jul</option>
                          <option value={8}>Ago</option>
                          <option value={9}>Sep</option>
                          <option value={10}>Oct</option>
                          <option value={11}>Nov</option>
                          <option value={12}>Dic</option>
                        </select>
                      </div>
                      <div className="w-16">
                        <label className="block text-xs text-gray-500 mb-1">Día</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={dataxConfig.annualDay}
                          onChange={(e) => setDataxConfig(prev => ({ ...prev, annualDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8 text-center"
                        />
                      </div>
                    </>
                  )}
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Hora</label>
                    <input
                      type="time"
                      value={dataxConfig.startTime}
                      onChange={(e) => setDataxConfig(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                    />
                  </div>
                  <div className="h-8 flex items-center gap-2 px-2 border border-gray-200 rounded bg-gray-50">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dataxConfig.isCyclic}
                        onChange={(e) => setDataxConfig(prev => ({ ...prev, isCyclic: e.target.checked }))}
                        className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Cíclico
                    </label>
                    {dataxConfig.isCyclic && (
                      <>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={dataxConfig.intervalHours}
                            onChange={(e) => setDataxConfig(prev => ({ ...prev, intervalHours: parseInt(e.target.value) }))}
                            className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                          />
                          <span className="text-xs text-gray-500">hrs</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Jobs de Ingesta */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">Jobs de Ingesta ({ingestaJobs.length})</span>
                <div className="flex gap-2">
                  <button
                    onClick={loadJobsFromPipelineGenerator}
                    disabled={isLoadingArtifacts}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-1"
                  >
                    <ArrowPathIcon className={`h-3 w-3 ${isLoadingArtifacts ? 'animate-spin' : ''}`} />
                    Cargar
                  </button>
                  <button onClick={addManualJob} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {ingestaJobs.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-3 border border-dashed border-gray-200 rounded">
                  Sin jobs. Carga desde Pipeline o agrega manualmente.
                </p>
              ) : (
                <div className="space-y-1">
                  {ingestaJobs.map((job, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs bg-gray-50 rounded px-2 py-1">
                      <input
                        type="text"
                        placeholder="yyyy-co-dfs-rmv-smcmuricm-01"
                        value={job.name}
                        onChange={(e) => updateJob(index, 'name', e.target.value)}
                        className="flex-1 min-w-0 px-1.5 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono text-xs"
                      />
                      <select
                        value={job.generator}
                        onChange={(e) => updateJob(index, 'generator', e.target.value)}
                        className="w-20 px-1 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      >
                        <option value="kirby">Kirby</option>
                        <option value="hammurabi">Hammurabi</option>
                        <option value="smartcleaner">SmartCleaner</option>
                      </select>
                      <select
                        value={job.phase}
                        onChange={(e) => updateJob(index, 'phase', e.target.value)}
                        className="w-16 px-1 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      >
                        <option value="staging">Stg</option>
                        <option value="raw">Raw</option>
                        <option value="master">Mst</option>
                        <option value="master-l1t">L1T</option>
                      </select>
                      <button
                        onClick={() => removeJob(index)}
                        className="p-0.5 text-gray-400 hover:text-red-500"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200" />

          {/* Mallas Existentes (modo aditivo) - centrado */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-medium">Mallas XML Existentes</span>
              <span className="text-xs text-gray-400">(opcional)</span>
              {isAnalyzingXml && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-gray-400" />}
              {nextSequences && !isAnalyzingXml && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Seq: T={nextSequences.T}, C={nextSequences.C}, D={nextSequences.D}
                </span>
              )}
            </div>
            <div className="flex justify-center gap-3">
              {/* T04 */}
              {existingT04FileName ? (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs">
                  <DocumentPlusIcon className="h-4 w-4" />
                  T04: {existingT04FileName.length > 25 ? existingT04FileName.substring(0, 25) + '...' : existingT04FileName}
                  <button onClick={() => removeExistingXml('t04')} className="hover:text-red-500">
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <label className="flex items-center gap-2 px-4 py-1.5 text-gray-500 border border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-xs min-w-[140px] justify-center">
                  <input type="file" accept=".xml" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleXmlFileUpload(file, 't04');
                    e.target.value = '';
                  }} />
                  <DocumentPlusIcon className="h-4 w-4" />
                  Cargar T04 (Datax)
                </label>
              )}
              {/* T02 */}
              {existingT02FileName ? (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs">
                  <DocumentPlusIcon className="h-4 w-4" />
                  T02: {existingT02FileName.length > 25 ? existingT02FileName.substring(0, 25) + '...' : existingT02FileName}
                  <button onClick={() => removeExistingXml('t02')} className="hover:text-red-500">
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <label className="flex items-center gap-2 px-4 py-1.5 text-gray-500 border border-dashed border-gray-300 rounded cursor-pointer hover:border-green-400 hover:bg-green-50 text-xs min-w-[140px] justify-center">
                  <input type="file" accept=".xml" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleXmlFileUpload(file, 't02');
                    e.target.value = '';
                  }} />
                  <DocumentPlusIcon className="h-4 w-4" />
                  Cargar T02 (Ingesta)
                </label>
              )}
            </div>
          </div>

          {uuaaMismatchWarning && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{uuaaMismatchWarning}</span>
            </div>
          )}

          {hasL1T && (
            <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded">
              <CheckCircleIcon className="h-4 w-4" />
              Flujo L1T detectado en los jobs
            </div>
          )}

          {/* Generation Section */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4" />
                {isGenerating ? 'Generando...' : isAdditiveMode ? 'Agregar a Mallas' : 'Generar Mallas'}
              </button>

              {!canGenerate && (
                <span className="text-xs text-gray-500">
                  {triggerType === 'filewatcher'
                    ? 'Requiere ruta staging, UUAA y jobs (carga desde Pipeline Generator)'
                    : isAdditiveMode ? 'Requiere transferencia y jobs' : 'Requiere transferencia, UUAA y jobs'}
                </span>
              )}

              {generatedJobs.length > 0 && !isGenerating && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {generatedJobs.length} jobs generados
                </div>
              )}

              {/* Info Tooltip */}
              <div className="relative ml-auto">
                <button
                  onMouseEnter={() => setShowInfoTooltip(true)}
                  onMouseLeave={() => setShowInfoTooltip(false)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </button>
                {showInfoTooltip && (
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Nomenclatura CUUAAXYTZZZ</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                      <div><span className="font-medium">C:</span> Pais (Colombia)</div>
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

            {/* Progress */}
            {isGenerating && (
              <div className="mt-3">
                <ProgressBar progress={progress} className="mb-1" />
                <p className="text-xs text-gray-500">{currentStep || 'Iniciando...'}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Generated Jobs Results */}
            {generatedJobs.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">Secuencia de Jobs ({uuaa.toUpperCase()})</span>
                  {generatedMallas.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {generatedMallas.map((malla) => (
                        <button
                          key={malla}
                          onClick={() => handleDownloadMalla(malla)}
                          disabled={downloadingFile === malla}
                          className={`text-xs px-2 py-1 rounded hover:opacity-80 flex items-center gap-1 disabled:opacity-50 ${
                            malla.includes('-T04') ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}
                          title={malla}
                        >
                          {downloadingFile === malla
                            ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                            : <DocumentArrowDownIcon className="h-3 w-3" />}
                          {malla.includes('-T04') ? (malla.includes('_des') ? 'T04 Des' : 'T04 Pro') : (malla.includes('_des') ? 'T02 Des' : 'T02 Pro')}
                        </button>
                      ))}
                      <button
                        onClick={handleDownloadDocsZip}
                        disabled={downloadingFile === 'docs-zip'}
                        className="text-xs px-2 py-1 rounded hover:opacity-80 flex items-center gap-1 bg-purple-100 text-purple-600 disabled:opacity-50"
                        title="Descargar documentación completa (Changelog, Manuales, Mallas)"
                      >
                        {downloadingFile === 'docs-zip'
                          ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                          : <DocumentArrowDownIcon className="h-3 w-3" />}
                        Descargar Documentación
                      </button>
                    </div>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-8">#</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Job Name</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Proceso</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-20">Tipo</th>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-24">Fase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {generatedJobs.map((job) => (
                        <tr key={job.order} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-400">{job.order}</td>
                          <td className="px-2 py-1.5 font-mono text-gray-700">{job.jobName}</td>
                          <td className="px-2 py-1.5 font-mono text-gray-500 truncate max-w-[200px]" title={job.originalJob || '-'}>
                            {job.originalJob ? (
                              <span className="flex items-center gap-1">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  job.phase === 'datax' ? 'bg-orange-400' : 'bg-cyan-400'
                                }`} />
                                {job.originalJob}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${getJobTypeColor(job.type)}`}>
                              {getJobTypeLabel(job.type)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-gray-500 capitalize">{job.phase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};