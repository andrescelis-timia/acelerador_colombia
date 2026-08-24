// ========================
// REQUESTS - Datos de entrada
// ========================

export interface ProcessSchemaRequest {
  schemaFile: File;
}

export type ValidationMode = 'STRICT_VALIDATION' | 'DISCARD_INVALID' | 'TOLERANT';

export interface GenerateKirbyRequest {
  object_id?: string;
  /** Modo de validación implícita que va al env del job Dataproc. */
  validation_mode?: ValidationMode;
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon' | 'tabla_no_raw';
  include_l1t?: boolean;
  periodicity?: 'daily' | 'weekly' | 'monthly' | 'annual';
  /** Override manual del alias. Si viene vacío el backend lo deriva del nombre físico. */
  alias?: string;
}

export interface GenerateHammurabiRequest {
  object_id?: string;
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon' | 'tabla_no_raw';
  include_l1t?: boolean;
  periodicity?: 'daily' | 'weekly' | 'monthly' | 'annual';
  /** Override manual del alias. Si viene vacío el backend lo deriva del nombre físico. */
  alias?: string;
}

export interface GenerateSmartCleanerRequest {
  object_id?: string;
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon' | 'tabla_no_raw';
  include_l1t?: boolean;
  periodicity?: 'daily' | 'weekly' | 'monthly' | 'annual';
  /** Override manual del alias. Si viene vacío el backend lo deriva del nombre físico. */
  alias?: string;
}

export interface GenerateControlMRequest {
  object_id?: string;
  jobsList: JobEntry[];
  componentType: 'tabla' | 'tablon' | 'tabla_no_raw';
  dataxConfig: DataxConfig;
  uuaa: string;
  transferName?: string;
  triggerType?: 'datax' | 'filewatcher';
  alias?: string;
  stagingPath?: string;
  generatedJobs?: ControlMJobGenerated[];
  existingT04Xml?: string;
  existingT02Xml?: string;
  /**
   * Campos de partición del schema. Sirven al backend para derivar las
   * variables de SENTRY_PARM (YEAR/MONTH/DAY/CUTOFF_DATE) según los
   * nombres de las particiones reales de la tabla.
   */
  partitions?: string[];
  /**
   * Buzon(es) destino de las notificaciones DOMAIL, separados por ';'.
   * Vacio => el backend usa el generico buzon.proyecto.group@bbva.com.
   */
  mailbox?: string;
}

export interface AnalyzeSequencesRequest {
  t04_xml?: string;
  t02_xml?: string;
  uuaa: string;
  temporality_code: string;
}

export interface AnalyzeSequencesResponse {
  next_sequences: {
    T: number;
    C: number;
    D: number;
    W: number;
  };
  folder_info: Record<string, {
    folderName: string;
    uuaa: string;
    normalizedUuaa: string;
    temporality: string;
    mallaType: string;
  }>;
}

export interface ControlMJobGenerated {
  jobName: string;
  type: 'T' | 'C' | 'D' | 'W';
  description: string;
  phase: string;
  originalJob?: string;
  order: number;
}

export interface JobEntry {
  name: string;
  type: 'datax' | 'kirby' | 'hammurabi' | 'smartcleaner';
}

export interface DataxConfig {
  periodicity: 'diario' | 'semanal' | 'mensual' | 'anual';
  periodicityType: 'calendario' | 'habil';
  startTime: string; // formato HH:MM
  timezone: string;
  isCyclic: boolean;
  intervalHours?: number;
  monthDay?: string; // CSV: "1" o "1,15,30"
  weekDay?: number;
  businessDayDirection?: 'D' | 'L';
  businessDayNumber?: string; // CSV: "1" o "1,2,3"
  annualMonth?: number;
  annualDay?: number;
}

// ========================
// RESPONSES - Datos de salida
// ========================

export interface ProcessSchemaResponse {
  success: boolean;
  message: string;
  data?: {
    name: string;
    namespace: string;
    database: 'raw' | 'master';
    securityLevel?: 'L1' | 'L2';
    partitions: string[];
    fields: SchemaField[];
    metadata: {
      detectedFrequency: 'daily' | 'monthly' | 'annual';
      hasL1TSupport: boolean;
      fieldAnalysis: FieldAnalysis;
    };
  };
}

export interface GenerateKirbyResponse {
  success: boolean;
  message: string;
  data?: {
    configs: Record<string, GeneratedFile>;
    jobs: Record<string, GeneratedFile>;
    metadata: {
      shouldGenerateL1T: boolean;
      masterSecurityLevel: string;
      detectedTransformations: string[];
      componentType: 'tabla' | 'tablon' | 'tabla_no_raw';
      stagingInputPath?: string;
      extractedInfo: {
        alias: string;
        namespace: string;
      };
    };
  };
  s3_urls?: Record<string, string>;
}

export interface GenerateHammurabiResponse {
  success: boolean;
  message: string;
  data?: {
    configs: Record<string, GeneratedFile>;
    jobs: Record<string, GeneratedFile>;
    metadata: {
      componentType: 'tabla' | 'tablon' | 'tabla_no_raw';
      generatedPhases: string[];
      extractedInfo: {
        alias: string;
        namespace: string;
      };
      fieldAnalysis: FieldAnalysis;
    };
  };
  s3_urls?: Record<string, string>;
}

export interface GenerateSmartCleanerResponse {
  success: boolean;
  message: string;
  data?: {
    configs: Record<string, GeneratedFile>;
    jobs: Record<string, GeneratedFile>;
    metadata: {
      shouldGenerateL1T: boolean;
      masterSecurityLevel: string;
      componentType: 'tabla' | 'tablon' | 'tabla_no_raw';
      extractedInfo: {
        alias: string;
        namespace: string;
      };
    };
  };
  s3_urls?: Record<string, string>;
}

export interface GenerateControlMResponse {
  success: boolean;
  message: string;
  data?: {
    jobs_sequence: ControlMJobGenerated[];
    config: {
      uuaa: string;
      transfer_name: string;
      datax_config: DataxConfig;
      component_type: string;
    };
    statistics: {
      total_jobs: number;
      transfer_jobs: number;
      ingesta_jobs: number;
      borrado_jobs: number;
    };
    mallas?: string[];
  };
  s3_urls?: Record<string, string>;
}

// ========================
// TIPOS AUXILIARES
// ========================

export interface SchemaField {
  name: string;
  type: string;
  nullable?: boolean;
  logicalFormat?: string;
  legacyName?: string;
}

export interface FieldAnalysis {
  nonNullFields: string[];
  stringFields: string[];
  numericFields: string[];
  dateTimeFields: string[];
  partitionFields: string[];
  keyFields: string[];
  patternFields: {
    [fieldName: string]: {
      detectedPattern: string;
      suggestedRegex: string;
    };
  };
}

export interface GeneratedFile {
  file_name: string;
  content: string;
  download_url?: string;
}

export interface ValidationWarning {
  type: 'warning' | 'error' | 'info';
  field?: string;
  message: string;
  suggestion?: string;
}

export interface ControlMJob {
  jobName: string; // formato CUUAAXYTZZZ
  originalName: string;
  type: 'T' | 'C' | 'D'; // Transfer, Process, Delete
  environment: 'D' | 'P'; // Development, Production
  sequence: string; // 001, 002, etc.
  dependencies: string[]; // jobNames que dependen de este
  conditions: {
    incond?: string;
    outcond?: string;
    docond?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type GeneratorType = 'kirby' | 'hammurabi' | 'smartcleaner' | 'controlm';

// ========================
// GENERATED ARTIFACTS (Persistencia)
// ========================

export interface GeneratedArtifactBase {
  id_generated_artifact: string;
  id_object: string;
  s3_urls?: Record<string, string>;
  creation_date?: string;
  creation_user?: string;
  update_date?: string;
}

export interface KirbyArtifact extends GeneratedArtifactBase {
  generator_type: 'kirby';
  artifacts_data: GenerateKirbyResponse['data'];
}

export interface HammurabiArtifact extends GeneratedArtifactBase {
  generator_type: 'hammurabi';
  artifacts_data: GenerateHammurabiResponse['data'];
}

export interface SmartCleanerArtifact extends GeneratedArtifactBase {
  generator_type: 'smartcleaner';
  artifacts_data: GenerateSmartCleanerResponse['data'];
}

export interface ControlMArtifact extends GeneratedArtifactBase {
  generator_type: 'controlm';
  artifacts_data: GenerateControlMResponse['data'];
}

export type GeneratedArtifact = KirbyArtifact | HammurabiArtifact | SmartCleanerArtifact | ControlMArtifact;

export interface SchemasArtifactData {
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon' | 'tabla_no_raw';
  raw_file_name?: string;
  master_file_name: string;
}

export interface GeneratedArtifactsResponse {
  object_id: string;
  artifacts: {
    kirby?: KirbyArtifact;
    hammurabi?: HammurabiArtifact;
    smartcleaner?: SmartCleanerArtifact;
    controlm?: ControlMArtifact;
    sample?: { artifacts_data?: Record<string, unknown>; s3_urls?: Record<string, string>; };
    schemas?: { artifacts_data?: SchemasArtifactData; };
  };
}

// Estado de artefactos generados para un objeto
export interface ArtifactsStatus {
  gobierno: boolean;
  kirby: boolean;
  hammurabi: boolean;
  smartcleaner: boolean;
  controlm: boolean;
}

// Response del endpoint ligero /status
export interface ArtifactsStatusResponse {
  object_id: string;
  status: ArtifactsStatus;
}

// ========================
// DEPLOY
// ========================

export interface DeployConfig {
  repositories: {
    kirby?: string;
    hammurabi?: string;
    smartcleaner?: string;
  };
  jira_hus: {
    kirby?: string;
    hammurabi?: string;
    smartcleaner?: string;
  };
  owner_emails: string[];
  datum_link?: string;
}

export interface DeployResult {
  success: boolean;
  generator_type: string;
  branch_name?: string;
  commit_sha?: string;
  pr_url?: string;
  pr_id?: number;
  deployed_files?: string[];
  error?: string;
  step?: string;
}

export interface DeployStatusItem {
  status: 'not_deployed' | 'success' | 'error';
  pr_url?: string;
  branch_name?: string;
  deployed_at?: string;
  error_message?: string;
}

export interface DeployStatusResponse {
  kirby?: DeployStatusItem;
  hammurabi?: DeployStatusItem;
  smartcleaner?: DeployStatusItem;
}

// ========================
// TIPOS DE ERROR
// ========================

export interface PipelineGeneratorError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  generator?: GeneratorType;
}

export class PipelineGeneratorException extends Error {
  public code: string;
  public generator?: GeneratorType;
  public details?: Record<string, unknown>;

  constructor(code: string, message: string, generator?: GeneratorType, details?: Record<string, unknown>) {
    super(message);
    this.name = 'PipelineGeneratorException';
    this.code = code;
    this.generator = generator;
    this.details = details;
  }
}