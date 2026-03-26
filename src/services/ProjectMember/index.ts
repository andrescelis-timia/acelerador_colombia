import { createFetcher } from '@/lib/api/fetcher';
import type { ProjectMember, AddMemberRequest, UpdateMemberRoleRequest } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ProjectMemberService {
  private fetcher;

  constructor(user: string, country: string) {
    this.fetcher = createFetcher(user, country);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await this.fetcher(`${API_URL}/api/v1/admin/projects/${projectId}/members`);
    return response.json();
  }

  async addMember(projectId: string, data: AddMemberRequest): Promise<ProjectMember> {
    const response = await this.fetcher(`${API_URL}/api/v1/admin/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateMemberRole(projectId: string, userId: string, data: UpdateMemberRoleRequest): Promise<ProjectMember> {
    const response = await this.fetcher(`${API_URL}/api/v1/admin/projects/${projectId}/members/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.fetcher(`${API_URL}/api/v1/admin/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getMyRole(projectId: string): Promise<string | null> {
    const response = await this.fetcher(`${API_URL}/api/v1/projects/${projectId}/my-role`);
    const data = await response.json();
    return data.role;
  }
}
