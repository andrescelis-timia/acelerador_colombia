import { DictionaryJsonHeaderResponse } from '../DictionaryJsonHeader/types';
import { DictionaryJsonDetailResponse } from '../DictionaryJsonDetail/types';
import { DictionaryBaseRawHeaderResponse } from '../DictionaryBaseRawHeader/types';
import { DictionaryBaseRawDetailResponse } from '../DictionaryBaseRawDetail/types';
import { DictionaryBaseMasterHeaderResponse } from '../DictionaryBaseMasterHeader/types';
import { DictionaryBaseMasterDetailResponse } from '../DictionaryBaseMasterDetail/types';
import { CreateDictionaryJsonHeader } from '../DictionaryJsonHeader/types';
import { CreateDictionaryJsonDetail } from '../DictionaryJsonDetail/types';

export interface GenerateDictionaryJsonRequest {
  header: CreateDictionaryJsonHeader;
  details: CreateDictionaryJsonDetail[];
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
  raw: {
    header: DictionaryBaseRawHeaderResponse;
    details: DictionaryBaseRawDetailResponse[];
  };
  master: {
    header: DictionaryBaseMasterHeaderResponse;
    details: DictionaryBaseMasterDetailResponse[];
  };
}

export interface GenerateDictionaryL1TRequest {
  id_object: string;
}

export interface GenerateDictionaryL1TResponse {
  dictionary_l1t_master_header_link: string;
  dictionary_l1t_master_detail_link: string;
} 