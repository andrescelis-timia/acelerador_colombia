import { DictionaryJsonHeaderResponse } from '../DictionaryJsonHeader/types';
import { DictionaryJsonDetailResponse } from '../DictionaryJsonDetail/types';
import { DictionaryBaseRawHeaderResponse } from '../DictionaryBaseRawHeader/types';
import { DictionaryBaseRawDetailResponse } from '../DictionaryBaseRawDetail/types';
import { DictionaryBaseMasterHeaderResponse } from '../DictionaryBaseMasterHeader/types';
import { DictionaryBaseMasterDetailResponse } from '../DictionaryBaseMasterDetail/types';
import { CreateDictionaryJsonHeader } from '../DictionaryJsonHeader/types';
import { CreateDictionaryJsonDetail } from '../DictionaryJsonDetail/types';

export interface GenerateDictionaryJsonRequest {
  id_object: string;
  sample_file_extension: string;
  sample_file_delimiter: string;
}

export interface GenerateDictionaryJsonResponse {
  header: DictionaryJsonHeaderResponse;
  details: DictionaryJsonDetailResponse[];
}

export interface GenerateDictionaryBaseRequest {
  header: CreateDictionaryJsonHeader;
  details: CreateDictionaryJsonDetail[];
}

export interface GenerateDictionaryBaseResponse {
  // Campos para modo full
  raw?: {
    header: DictionaryBaseRawHeaderResponse;
    details: DictionaryBaseRawDetailResponse[];
  };
  master?: {
    header: DictionaryBaseMasterHeaderResponse;
    details: DictionaryBaseMasterDetailResponse[];
  };
  links?: {
    dictionary_raw_header_link: string;
    dictionary_raw_details_link: string;
    dictionary_master_header_link: string;
    dictionary_master_details_link: string;
  };
}

export interface GenerateDictionaryL1TRequest {
  id_object: string;
}

export interface GenerateDictionaryL1TResponse {
  dictionary_l1t_master_header_link: string;
  dictionary_l1t_master_detail_link: string;
}

export type LiteCoOperationMode = 'new' | 'update';

export interface GenerateDictionaryLiteCoRequest {
  object_id: string;
  periodicity: 'daily' | 'weekly' | 'monthly' | 'yearly';
  operation_mode?: LiteCoOperationMode;
  target_legacy_names?: string[];
}

export interface GenerateDictionaryLiteCoResponse {
  success: boolean;
  message: string;
  data?: {
    mode: 'lite_co' | 'lite_co_update';
    rows_updated: number;
    sheet_url: string;
    processed_legacy_names?: string[];
  };
}