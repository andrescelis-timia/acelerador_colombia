import { ProjectResponse, ProjectTableData, ProjectDashboardData, ProjectStatus, ProjectUpdate } from './types';

export const transformToTableData = (projects: ProjectResponse[]): ProjectTableData[] => {
  return projects.map(project => ({
    id_project: project.id_project,
    name: project.name,
    status: project.status,
    creation_date: project.creation_date
  }));
};

export const transformToDashboardData = (projects: ProjectResponse[]): ProjectDashboardData => {
  return {
    total: projects.length,
    completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
    inProgress: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
    pending: projects.filter(p => p.status === ProjectStatus.PENDING).length
  };
};

export const transformToUpdateData = (project: ProjectResponse): ProjectUpdate => ({
  ticket_jira: project.ticket_jira,
  name: project.name,
  status: project.status,
  update_user: project.update_user || ''
}); 