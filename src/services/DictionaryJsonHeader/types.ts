export interface DictionaryJsonHeaderResponse {
  id_dictionary_json_header: string;
  id_object: string;
  country: string;
  origin: string;
  app_product: string;
  name_origin: string;
  table_content_origin: string;
  primary_keys_table: string;
  table_name_datio: string;
  primary_keys_datio: string;
  table_raw_name: string;
  table_master_name: string;
  information_group_level_2: string;
  partition_fields_raw: string;
  aggregate_fields_raw: string;
  path_input_raw: string;
  path_output_raw: string;
  partition_fields_master: string;
  aggregate_fields_master: string;
  path_input_master: string;
  path_output_master: string;
  number_records_period_intake: string;
  creation_date: string;
  creation_user: string;
  update_date?: string;
  update_user?: string;
} 