export interface GenerateTableRequest {
  id_object: string;
}

export interface GenerateTableResponse {
  content: string;
}

export interface ErrorResponse {
  detail: string;
}

// Tipos para apply-operations endpoint
export interface ApplyOperationDetailRequest {
  request: string;
  table_code: string;
  column_logical_name?: string;
  comments?: string;
}

export interface ApplyOperationsRequest {
  details: ApplyOperationDetailRequest[];
}

export interface ApplyOperationDetailResponse {
  request: string;
  table_code: string;
  column_logical_name?: string;
  comments?: string;
  status: 'GENERATED' | 'REPLIED' | 'ERROR';
  reply?: string;
  error?: string;
}

export interface ApplyOperationsResponse {
  results: ApplyOperationDetailResponse[];
  vb_script: string;
} 