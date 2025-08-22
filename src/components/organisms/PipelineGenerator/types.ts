export interface PipelineGeneratorProps {
  // Props principales del componente
}

export interface GeneratorPanelProps {
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon';
  canGenerate: boolean;
  onGenerationComplete?: () => void;
}

export interface ControlMGeneratorPanelProps {
  rawSchema: File | null;
  masterSchema: File | null;
  componentType: 'tabla' | 'tablon';
  canGenerate: boolean;
  onGenerationComplete?: () => void;
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

export interface SchemaField {
  name: string;
  type: string;
  nullable?: boolean;
  logicalFormat?: string;
  legacyName?: string;
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

export type GeneratorType = 'kirby' | 'hammurabi' | 'smartcleaner' | 'controlm';