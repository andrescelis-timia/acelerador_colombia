export interface SchemaGenerationFlowProps {
  objectId: string;
}

export interface SchemaField {
  name: string;
  type: string | [string, string];
  legacyName: string;
  logicalFormat: string;
  deleted: boolean;
  metadata: boolean;
  locale: string;
  default: string;
  format?: string;
  encrypted?: boolean;
  encryptionType?: string;
  encryptionMethod?: string;
}

export interface Schema extends Record<string, unknown> {
  namespace: string;
  name: string;
  doc: string;
  database: string;
  storageZone: string;
  storageType: string;
  physicalPath: string;
  objectVersion: string;
  partitions: string[];
  type: string;
  fields: SchemaField[];
  securityLevel?: string;
}

export interface SchemaGenerationResponse {
  object_id: string;
  schemas: {
    raw: Schema;
    master: Schema;
    l1t?: Schema;
  };
  has_l1t: boolean;
  table_names: {
    raw: string;
    master: string;
    l1t?: string;
  };
  generated_at: string;
  generated_by: string;
  country: string;
}

export interface GenerationStatus {
  isGenerating: boolean;
  isGenerated: boolean;
  error: string | null;
  generatedSchemas: SchemaGenerationResponse | null;
}