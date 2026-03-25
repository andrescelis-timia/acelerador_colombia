import { SchemaField, GeneratorType, GeneratedArtifact } from '@/services/PipelineGenerator/types';

// Re-exportar tipos centralizados para uso en componentes
export type { SchemaField, GeneratorType };

// PipelineGeneratorProps - props para el componente principal
export interface PipelineGeneratorProps {
  objectId?: string;
}

export interface GeneratorPanelProps {
  objectId?: string;
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon';
  canGenerate: boolean;
  onGenerationComplete?: () => void;
  initialData?: GeneratedArtifact | null;
}

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

