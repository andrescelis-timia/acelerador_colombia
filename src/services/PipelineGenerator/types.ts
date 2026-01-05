// ========================
// REQUESTS - Datos de entrada
// ========================

export interface ProcessSchemaRequest {
  schemaFile: File;
}

export interface GenerateKirbyRequest {
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon';
  include_l1t?: boolean;
}

export interface GenerateHammurabiRequest {
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon';
  include_l1t?: boolean;
}

export interface GenerateSmartCleanerRequest {
  raw_schema_data?: Record<string, unknown>;
  master_schema_data: Record<string, unknown>;
  component_type: 'tabla' | 'tablon';
  include_l1t?: boolean;
}

export interface GenerateControlMRequest {
  xml1?: File;
  xml2?: File;
  jobsList: JobEntry[];
  componentType: 'tabla' | 'tablon';
  dataxConfig: DataxConfig;
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
  monthDay?: number;
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
      componentType: 'tabla' | 'tablon';
      extractedInfo: {
        alias: string;
        namespace: string;
      };
    };
  };
}

export interface GenerateHammurabiResponse {
  success: boolean;
  message: string;
  data?: {
    configs: Record<string, GeneratedFile>;
    jobs: Record<string, GeneratedFile>;
    metadata: {
      componentType: 'tabla' | 'tablon';
      generatedPhases: string[];
      includeL1T: boolean;
      extractedInfo: {
        alias: string;
        namespace: string;
      };
      fieldAnalysis: FieldAnalysis;
    };
  };
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
      componentType: 'tabla' | 'tablon';
      extractedInfo: {
        alias: string;
        namespace: string;
      };
    };
  };
}

export interface GenerateControlMResponse {
  success: boolean;
  message: string;
  data?: {
    mallas: {
      dataxDesarrollo: GeneratedFile;
      dataxProduccion: GeneratedFile;
      ingestaDesarrollo: GeneratedFile;
      ingestaProduccion: GeneratedFile;
    };
    jobsSequence: {
      datax: ControlMJob[];
      ingesta: ControlMJob[];
    };
    statistics: {
      uuaa: string;
      temporality: string;
      temporalityCode: string;
      totalJobs: number;
      sequenceStats: {
        datax: { total: number; transferencias: number };
        ingesta: { 
          total: number; 
          calidad: number; 
          borrado: number;
          phases: { staging: number; raw: number; master: number; masterL1T: number };
        };
      };
    };
    validations: {
      xmlValidation: ValidationResult;
      jobsValidation: ValidationResult;
      sequenceValidation: ValidationResult;
    };
  };
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

export interface RuleInfo {
  ruleId: string;
  className: string;
  config: Record<string, unknown>;
  fields?: string[];
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

// ========================
// TIPOS DE BATCH PROCESSING
// ========================

export interface BatchGenerationRequest {
  rawSchemaData?: Record<string, unknown>;
  masterSchemaData: Record<string, unknown>;
  componentType: 'tabla' | 'tablon';
  selectedGenerators: GeneratorType[];
  controlMData?: {
    xml1?: File;
    xml2?: File;
    jobsList: JobEntry[];
    dataxConfig: DataxConfig;
  };
}

export interface BatchGenerationResponse {
  success: boolean;
  message: string;
  results: {
    kirby?: GenerateKirbyResponse;
    hammurabi?: GenerateHammurabiResponse;
    smartcleaner?: GenerateSmartCleanerResponse;
    controlm?: GenerateControlMResponse;
  };
  summary: {
    totalConfigs: number;
    totalJobs: number;
    generatedFiles: GeneratedFile[];
    errors: string[];
    warnings: string[];
  };
}

export type GeneratorType = 'kirby' | 'hammurabi' | 'smartcleaner' | 'controlm';

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