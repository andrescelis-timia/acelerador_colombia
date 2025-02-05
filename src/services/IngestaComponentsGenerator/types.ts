export interface GenerateRawFilesRequest {
  id_object: string;
}

export interface AIGeneratorRawFilesResponse {
  component_raw_conf_link: string;
  component_raw_json_link: string;
}

export interface GenerateMasterFilesRequest {
  id_object: string;
}

export interface AIGeneratorMasterFilesResponse {
  component_master_conf_link: string;
  component_master_json_link: string;
}

export interface GenerateL1TMasterFilesRequest {
  id_object: string;
}

export interface AIGeneratorComponentL1TMasterFilesResponse {
  component_l1t_master_conf_link: string;
  component_l1t_master_json_link: string;
} 