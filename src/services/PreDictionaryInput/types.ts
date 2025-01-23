export interface CreatePreDictionaryInput extends Record<string, unknown> {
  id_object: string;
  origin: string;
  app_product: string;
  name_origin: string;
  table_raw_name: string;
  table_master_name: string;
  partition_fields_raw?: string | null;
  aggregate_fields_raw?: string | null;
  path_input_raw?: string | null;
  path_output_raw?: string | null;
  path_input_master?: string | null;
  path_output_master?: string | null;
  aggregate_fields_master?: string | null;
}

export interface UpdatePreDictionaryInput extends Record<string, unknown> {
  origin: string;
  app_product: string;
  name_origin: string;
  table_raw_name: string;
  table_master_name: string;
  partition_fields_raw?: string | null;
  aggregate_fields_raw?: string | null;
  path_input_raw?: string | null;
  path_output_raw?: string | null;
  path_input_master?: string | null;
  path_output_master?: string | null;
  aggregate_fields_master?: string | null;
}

export interface PreDictionaryInputResponse extends Record<string, unknown> {
  id_pre_dictionary_input: string;
  id_object: string;
  origin: string;
  app_product: string;
  name_origin: string;
  table_raw_name: string;
  table_master_name: string;
  partition_fields_raw: string | null;
  aggregate_fields_raw: string | null;
  path_input_raw: string | null;
  path_output_raw: string | null;
  path_input_master: string | null;
  path_output_master: string | null;
  aggregate_fields_master: string | null;
  owner_country: string;
  creation_date: string;
  creation_user: string;
  update_date: string | null;
  update_user: string | null;
} 