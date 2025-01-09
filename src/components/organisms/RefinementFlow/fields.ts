export const getAllPossibleFields = (suffix: string): number => {
  switch (suffix) {
    case 'origin':
      return Object.keys({
        responsable_origin: '',
        app_product_origin: '',
        source_origin: '',
        frequency_origin: '',
        name_origin: '',
        table_description_origin: '',
        table_content_origin: '',
        flag_table_events_origin: false,
        update_data_event_origin: '',
        update_date_event_origin: '',
        update_date_value_origin: '',
        copy_cobol_origin: '',
        mapping_origin: '',
        primary_key_table_origin: '',
        flag_table_backup_origin: false,
        flag_update_origin_key_origin: false,
        number_fields_origin: 0,
        flag_table_depuration_origin: false,
        table_content_staying_origin: '',
        depure_table_origin: '',
        moment_table_taken_origin: ''
      }).length;
    case 'transmission':
      return Object.keys({
        content_transmission: '',
        news_transmission: '',
        field_transmission: ''
      }).length;
    case 'datio':
      return Object.keys({
        responsable_datio: '',
        table_name_datio: '',
        use_case_datio: '',
        product_owner_datio: '',
        table_primary_keys_datio: '',
        flag_update_key_datio: false,
        historical_datio: '',
        intake_period_datio: '',
        number_records_intake_datio: 0,
        flag_net_controlm_datio: false
      }).length;
    case 'definition':
      return Object.keys({
        execution_frequency_definition: '',
        calendar_controlm_definition: '',
        table_file_content_definition: '',
        received_staging_filename_definition: '',
        table_raw_name_definition: '',
        table_master_name_definition: ''
      }).length;
    case 'staging':
      return Object.keys({
        path_base_staging: '',
        path_staging: ''
      }).length;
    case 'raw':
      return Object.keys({
        variables_controlm_format_raw: '',
        partition_fields_raw: '',
        intake_mode_raw: '',
        motive_intake_mode_raw: '',
        reprocess_fields_raw: '',
        aggregate_fields_raw: '',
        path_input_raw: '',
        path_output_base_raw: '',
        path_output_raw: '',
        filters_pre_intake_raw: '',
        observations_raw: ''
      }).length;
    case 'master':
      return Object.keys({
        variables_controlm_format_master: '',
        partition_fields_master: '',
        intake_mode_master: '',
        motive_intake_mode_master: '',
        reprocess_fields_master: '',
        aggregate_fields_master: '',
        path_input_master: '',
        path_output_base_master: '',
        path_output_master: '',
        filters_pre_intake_master: '',
        observations_master: ''
      }).length;
    default:
      return 0;
  }
}; 