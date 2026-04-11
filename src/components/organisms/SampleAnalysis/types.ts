export interface SampleTransformation {
  type: string;
  description: string;
  target_format?: string;
  from?: string;
  to?: string;
}

export interface SampleField {
  position: number;
  field_name: string;
  data_type: string;
  format: string | null;
  nullable: boolean;
  sample_values: string[];
  suggested_transformations: SampleTransformation[];
}

export interface SampleMetadata {
  total_rows: number;
  total_columns: number;
  delimiter: string | null;
  has_header: boolean;
  file_name: string;
  file_size: number;
  file_type: string;
}

export interface SampleAnalysisResult {
  success: boolean;
  message?: string;
  metadata?: SampleMetadata;
  fields?: SampleField[];
  preview_rows?: string[][];
  validation_warning?: string;
  validation_ok?: string;
}

export interface SampleAnalysisProps {
  objectId: string;
  initialData?: { artifacts_data?: Record<string, unknown>; s3_urls?: Record<string, string> } | null;
}