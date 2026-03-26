import { createFetcher } from '@/lib/api/fetcher';
import type { ProjectMember, AddMemberRequest, UpdateMemberRoleRequest } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ProjectMemberService {
  private fetcher;

  constructor(user: string, country: string) {
    this.fetcher = createFetcher(user, country);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    return await this.fetcher(`${API_URL}/admin/projects/${projectId}/members`);
  }

  async addMember(projectId: string, data: AddMemberRequest): Promise<ProjectMember> {
    return await this.fetcher(`${API_URL}/admin/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async updateMemberRole(projectId: string, userId: string, data: UpdateMemberRoleRequest): Promise<ProjectMember> {
    return await this.fetcher(`${API_URL}/admin/projects/${projectId}/members/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.fetcher(`${API_URL}/admin/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getMyRole(projectId: string): Promise<string | null> {
    const data = await this.fetcher(`${API_URL}/projects/${projectId}/my-role`);
    return data.role;
  }
}
