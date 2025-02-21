export enum PreDictionaryPeriodicity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface CreatePreDictionaryInput extends Record<string, unknown> {
  id_object: string;
  origin: string;
  app_product: string;
  name_origin: string;
  table_content_origin: string;
  table_raw_name: string;
  table_master_name: string;  
  information_group_level_2: string;
  number_records_period_intake: string;
  periodicity: PreDictionaryPeriodicity;
}

export interface UpdatePreDictionaryInput extends Record<string, unknown> {
  origin: string;
  app_product: string;
  name_origin: string;
  table_content_origin: string;
  table_raw_name: string;
  table_master_name: string;  
  information_group_level_2: string;
  number_records_period_intake: string;
  periodicity: PreDictionaryPeriodicity;
}

export interface PreDictionaryInputResponse extends Record<string, unknown> {
  id_pre_dictionary_input: string;
  id_object: string;
  origin: string;
  app_product: string;
  name_origin: string;
  table_content_origin: string;
  table_raw_name: string;
  table_master_name: string;  
  information_group_level_2: string;
  number_records_period_intake: string;
  periodicity: PreDictionaryPeriodicity;  
  owner_country: string;
  creation_date: string;
  creation_user: string;
  update_date: string | null;
  update_user: string | null;
} 