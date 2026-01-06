import { SchemaField, GeneratorType } from '@/services/PipelineGenerator/types';

// Re-exportar tipos centralizados para uso en componentes
export type { SchemaField, GeneratorType };

// PipelineGeneratorProps vacío - el componente no recibe props externos
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PipelineGeneratorProps {}

export interface GeneratorPanelProps {
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon';
  canGenerate: boolean;
  onGenerationComplete?: () => void;
}

// ControlM y otros generadores usan la misma interfaz base
export type ControlMGeneratorPanelProps = GeneratorPanelProps;

export interface SchemaUploadSectionProps {
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon';
  onSchemaUpload: (type: 'raw' | 'master', file: File | null) => void;
  onComponentTypeChange: (type: 'tabla' | 'tablon') => void;
  completedGenerators?: string[];
}

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
  supportedTypes: ('tabla' | 'tablon')[];
}

