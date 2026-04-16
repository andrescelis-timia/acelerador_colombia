export type ProjectRole = 'OWNER' | 'OWNER_READONLY' | 'DEVELOPER';

export interface ProjectMember {
  id_project_member: string;
  id_project: string;
  id_user: string;
  user_email: string | null;
  project_role: ProjectRole;
  creation_date: string;
}

export interface AddMemberRequest {
  user_email: string;
  project_role: ProjectRole;
}

export interface UpdateMemberRoleRequest {
  project_role: ProjectRole;
}
