export interface IngestaOutputResponse {
  id_dictionary_output: string;
  id_object: string;
  dictionary_raw_header_link: string | null;
  dictionary_raw_details_link: string | null;
  dictionary_master_header_link: string | null;
  dictionary_master_details_link: string | null;
  datum_raw_header_link: string | null;
  datum_raw_details_link: string | null;
  datum_master_header_link: string | null;
  datum_master_details_link: string | null;
  component_raw_conf_link: string | null;
  component_raw_json_link: string | null;
  component_master_conf_link: string | null;
  component_master_json_link: string | null;
  owner_country: string;
  creation_date: string;
  creation_user: string;
  update_date: string | null;
  update_user: string | null;
} 