export interface CreateDictionaryJsonDetail {
  id_dictionary_json_header: string;
  name_field?: string;
  logical_format?: string;
  date_format?: string;
  calculated?: string;
  key_origin?: string;
  key_datio?: string;
  description?: string;
  observation?: string;
  required?: string;
}

export interface DictionaryJsonDetailResponse {
  id_dictionary_json_detail: string;
  id_dictionary_json_header: string;
  name_field: string;
  logical_format: string;
  date_format: string;
  calculated: string;
  key_origin: string;
  key_datio: string;
  description: string;
  observation: string;
  required: string;
  owner_country: string;
  creation_date: string;
  creation_user: string;
  update_date?: string;
  update_user?: string;
} 