// Base interfaces
interface RefinementBase extends Record<string, unknown> {
  creation_user?: string;
  update_user?: string;
}

// Origin interfaces
export interface RefinementOriginCreate extends RefinementBase {
  id_object: string;
  responsable_origin?: string;
  app_product_origin?: string;
  source_origin?: string;
  frequency_origin?: string;
  name_origin?: string;
  table_description_origin?: string;
  table_content_origin?: string;
  flag_table_events_origin?: boolean;
  update_data_event_origin?: string;
  update_date_event_origin?: string;
  update_date_value_origin?: string;
  copy_cobol_origin?: string;
  mapping_origin?: string;
  primary_key_table_origin?: string;
  flag_table_backup_origin?: boolean;
  flag_update_origin_key_origin?: boolean;
  number_fields_origin?: number;
  flag_table_depuration_origin?: boolean;
  table_content_staying_origin?: string;
  depure_table_origin?: string;
  moment_table_taken_origin?: string;
}

export interface RefinementOriginUpdate extends Omit<RefinementOriginCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementOriginUpdateWithId extends RefinementOriginUpdate {
  id_refinement: string;
}

// Transmission interfaces
export interface RefinementTransmissionCreate extends RefinementBase {
  id_object: string;
  content_transmission?: string;
  news_transmission?: string;
  field_transmission?: string;
}

export interface RefinementTransmissionUpdate extends Omit<RefinementTransmissionCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementTransmissionUpdateWithId extends RefinementTransmissionUpdate {
  id_refinement: string;
}

// Datio interfaces
export interface RefinementDatioCreate extends RefinementBase {
  id_object: string;
  responsable_datio?: string;
  table_name_datio?: string;
  use_case_datio?: string;
  product_owner_datio?: string;
  table_primary_keys_datio?: string;
  flag_update_key_datio?: boolean;
  historical_datio?: string;
  intake_period_datio?: string;
  number_records_intake_datio?: number;
  flag_net_controlm_datio?: boolean;
}

export interface RefinementDatioUpdate extends Omit<RefinementDatioCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementDatioUpdateWithId extends RefinementDatioUpdate {
  id_refinement: string;
}

// Definition interfaces
export interface RefinementDefinitionCreate extends RefinementBase {
  id_object: string;
  execution_frequency_definition?: string;
  calendar_controlm_definition?: string;
  table_file_content_definition?: string;
  received_staging_filename_definition?: string;
  table_raw_name_definition?: string;
  table_master_name_definition?: string;
}

export interface RefinementDefinitionUpdate extends Omit<RefinementDefinitionCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementDefinitionUpdateWithId extends RefinementDefinitionUpdate {
  id_refinement: string;
}

// Staging interfaces
export interface RefinementStagingCreate extends RefinementBase {
  id_object: string;
  path_base_staging?: string;
  path_staging?: string;
}

export interface RefinementStagingUpdate extends Omit<RefinementStagingCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementStagingUpdateWithId extends RefinementStagingUpdate {
  id_refinement: string;
}

// Raw interfaces
export interface RefinementRawCreate extends RefinementBase {
  id_object: string;
  variables_controlm_format_raw?: string;
  partition_fields_raw?: string;
  intake_mode_raw?: string;
  motive_intake_mode_raw?: string;
  reprocess_fields_raw?: string;
  aggregate_fields_raw?: string;
  path_input_raw?: string;
  path_output_base_raw?: string;
  path_output_raw?: string;
  filters_pre_intake_raw?: string;
  observations_raw?: string;
}

export interface RefinementRawUpdate extends Omit<RefinementRawCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementRawUpdateWithId extends RefinementRawUpdate {
  id_refinement: string;
}

// Master interfaces
export interface RefinementMasterCreate extends RefinementBase {
  id_object: string;
  variables_controlm_format_master?: string;
  partition_fields_master?: string;
  intake_mode_master?: string;
  motive_intake_mode_master?: string;
  reprocess_fields_master?: string;
  aggregate_fields_master?: string;
  path_input_master?: string;
  path_output_base_master?: string;
  path_output_master?: string;
  filters_pre_intake_master?: string;
  observations_master?: string;
}

export interface RefinementMasterUpdate extends Omit<RefinementMasterCreate, 'creation_user'> {
  update_user: string;
}

export interface RefinementMasterUpdateWithId extends RefinementMasterUpdate {
  id_refinement: string;
}

// Response interface
export interface RefinementResponse {
  id_refinement: string;
  id_object: string;
  status: 'in_progress' | 'completed';
  origin?: RefinementOriginCreate;
  transmission?: RefinementTransmissionCreate;
  datio?: RefinementDatioCreate;
  definition?: RefinementDefinitionCreate;
  staging?: RefinementStagingCreate;
  raw?: RefinementRawCreate;
  master?: RefinementMasterCreate;
  creation_date: string;
  creation_user: string;
  update_date?: string;
  update_user?: string;
} 