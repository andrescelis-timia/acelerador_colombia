export enum ProjectStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface ProjectCreate extends Record<string, unknown> {
  name: string;
  ticket_jira: string;
  creation_user: string;
}

export interface ProjectUpdate {
  ticket_jira: string;
  name: string;
  status: ProjectStatus;
  update_user: string;
}

export interface ProjectUpdateWithId extends Record<string, unknown> {
  id_project: string;
}

export interface ProjectResponse {
  id_project: string;
  ticket_jira: string;
  name: string;
  status: ProjectStatus;
  owner_country: string;
  creation_date: string;
  creation_user: string;
  update_date?: string;
  update_user?: string;
  active: boolean;
}

// Formato para la tabla
export interface ProjectTableData {
  id_project: string;
  ticket_jira: string;
  name: string;
  status: ProjectStatus;
  creation_date: string;
}

// Formato para el dashboard
export interface ProjectDashboardData {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
} 