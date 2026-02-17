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
  output_mode?: 'full' | 'reduced_co';
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
  // Campos para modo reduced_co
  success?: boolean;
  message?: string;
  data?: {
    mode?: 'full' | 'reduced_co';
    rows_updated?: number;
    sheet_url?: string;
  };
}

export interface GenerateDictionaryL1TRequest {
  id_object: string;
}

export interface GenerateDictionaryL1TResponse {
  dictionary_l1t_master_header_link: string;
  dictionary_l1t_master_detail_link: string;
}

export interface GenerateDictionaryLiteCoRequest {
  object_id: string;
  periodicity: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface GenerateDictionaryLiteCoResponse {
  success: boolean;
  message: string;
  data?: {
    mode: 'lite_co';
    rows_updated: number;
    sheet_url: string;
  };
} 