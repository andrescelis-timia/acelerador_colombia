import { SchemaField, GeneratorType, GeneratedArtifact } from '@/services/PipelineGenerator/types';
import type { Periodicity } from '@/services/Object/types';

// Re-exportar tipos centralizados para uso en componentes
export type { SchemaField, GeneratorType };

// PipelineGeneratorProps - props para el componente principal
export interface PipelineGeneratorProps {
  objectId?: string;
  readOnly?: boolean;
}

export interface GeneratorPanelProps {
  objectId?: string;
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon' | 'tabla_no_raw';
  canGenerate: boolean;
  onGenerationComplete?: () => void;
  initialData?: GeneratedArtifact | null;
  periodicity?: Periodicity;
  /** Override manual del alias. Vacío = derivación automática del nombre físico. */
  aliasOverride?: string;
  /** Solo lo usa Kirby: es el único generador cuyos jobs llevan `env`. */
  validationMode?: ValidationMode;
}

export interface SchemaUploadSectionProps {
  objectId?: string;
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon' | 'tabla_no_raw';
  onSchemaUpload: (type: 'raw' | 'master', file: File | null) => void;
  onComponentTypeChange: (type: 'tabla' | 'tablon' | 'tabla_no_raw') => void;
  /** Override manual del alias. Vacío = derivación automática. */
  aliasOverride?: string;
  onAliasOverrideChange?: (value: string) => void;
  /** Modo con el que la plataforma valida durante la ingesta. */
  validationMode?: ValidationMode;
  onValidationModeChange?: (value: ValidationMode) => void;
}

/**
 * Validación implícita de la plataforma. Sustituye a los Hammurabi de staging
 * y master, que dejaron de generarse.
 */
export type ValidationMode = 'STRICT_VALIDATION' | 'DISCARD_INVALID' | 'TOLERANT';

export interface SchemaFile {
  name: string;
  namespace: string;
  database: 'raw' | 'master';
  securityLevel?: 'L1' | 'L2';
  partitions: string[];
  fields: SchemaField[];
}


export interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    configs?: { [key: string]: string };
    jobs?: { [key: string]: string };
    downloadLinks?: { [key: string]: string };
  };
}

export interface ValidationError {
  message: string;
  severity: 'error' | 'warning';
}

export interface GeneratorConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  requiredSchemas: ('raw' | 'master')[];
  supportedTypes: ('tabla' | 'tablon' | 'tabla_no_raw')[];
}

