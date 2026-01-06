export enum ObjectStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export type PipelineStageStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface PipelineStageState {
  status: PipelineStageStatus;
  message?: string;
  updated_at?: string;
}

export interface PipelineStatus {
  gobierno: PipelineStageState;
  kirby: PipelineStageState;
  hammurabi: PipelineStageState;
  smartcleaner: PipelineStageState;
  controlm: PipelineStageState;
}

export interface ObjectCreate extends Record<string, unknown> {
  name: string;
  alias: string;
  url_document: string;
  id_project: string;
  creation_user: string;
  flag_l1t: boolean;
}

export interface ObjectUpdate {
  name: string;
  alias: string;
  status: ObjectStatus;
  url_document: string;
  update_user: string;
  flag_l1t: boolean;
}

export interface ObjectUpdateWithId extends Record<string, unknown> {
  id_object: string;
  id_project: string;
}

export interface ObjectResponse {
  id_object: string;
  id_project: string;
  name: string;
  alias: string;
  status: ObjectStatus;
  owner_country: string;
  url_document: string;
  creation_date: string;
  creation_user: string;
  update_date?: string;
  update_user?: string;
  flag_l1t: boolean;
  active: boolean;
  project_name: string;
  pipeline_status?: PipelineStatus;
}

export interface ObjectTableData {
  id_object: string;
  name: string;
  alias: string;
  status: ObjectStatus;
  url_document: string;
  creation_date: string;
  project_name: string;
  pipeline_status?: PipelineStatus;
} 