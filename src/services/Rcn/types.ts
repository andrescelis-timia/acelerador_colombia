export type SearchMode = 'semantic' | 'hybrid' | 'strict' | 'exact';
export type SearchField = 'name' | 'description' | 'both';

export const HIERARCHY_VALUES = [
  'PRINCIPAL',
  'GLOBAL MODEL',
  'LEGACY',
  'SPECIFIC',
  'SECONDARY',
  'GLOBAL MODEL SECONDARY',
] as const;
export type Hierarchy = typeof HIERARCHY_VALUES[number];

export const SECURITY_STATUS_VALUES = [
  'Approved',
  'Developer approved',
  'Local security pending',
] as const;
export type SecurityStatus = typeof SECURITY_STATUS_VALUES[number];

export interface RcnSearchRequest {
  text: string;
  field?: SearchField;
  mode?: SearchMode;
  threshold?: number;
  limit?: number;
  hierarchy?: Hierarchy;
}

export interface RcnEntry {
  id: number;
  physical_name_field: string;
  logical_name_sp: string;
  logical_name_eng?: string;
  field_description_sp: string;
  field_description_eng?: string;
  hierarchy: string;
  security_class?: string;
  security_label?: string;
  security_status?: string;
  date_of_registration?: string;
  date_of_last_modification?: string;
  similarity?: number;
  matched_field?: 'name' | 'description';
  keyword_recall?: number;
  keyword_precision?: number;
  raw_length_ratio?: number;
  combined_score?: number;
}

export interface RcnSearchResponse {
  data: RcnEntry[];
  count: number;
}

export interface RcnCamposParams {
  fields?: string;
  physical_name?: string;
  logical_name?: string;
  description?: string;
  hierarchy?: string;
  security_status?: string;
  limit?: number;
}

export interface RcnQueryRequest {
  query: string;
  params?: unknown[];
}

export interface RcnQueryResponse {
  data: Record<string, unknown>[];
  count: number;
}
