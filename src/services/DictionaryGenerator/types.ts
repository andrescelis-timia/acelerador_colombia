import { DictionaryJsonHeaderResponse } from '../DictionaryJsonHeader/types';

export interface FieldDefinition {
  format: string;
  name: string;
  nullable: boolean;
  order: number;
  title: string;
}

export interface GenerateDictionaryRequest {
  id_object: string;
  fields: FieldDefinition[];
  creation_user: string;
}

export interface DictionaryJsonDetail {
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
  creation_date: string;
  creation_user: string;
  update_date?: string;
  update_user?: string;
}

export interface GenerateDictionaryResponse {
  header: DictionaryJsonHeaderResponse;
  details: DictionaryJsonDetail[];
} 