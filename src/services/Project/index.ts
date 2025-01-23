import { ProjectCreate, ProjectDashboardData, ProjectResponse, ProjectTableData, ProjectUpdateWithId } from './types';
import { transformToTableData, transformToDashboardData, transformToUpdateData } from './transforms';
import { createFetcher } from '@/lib/api/fetcher';
import { ObjectTableData } from '../Object/types';
import { transformToTableData as objectTransformToTableData } from '../Object/transforms';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAllData(transform: 'table', user: string, country: string): Promise<ProjectTableData[]>;
function getAllData(transform: 'dashboard', user: string, country: string): Promise<ProjectDashboardData>;
function getAllData(transform: 'raw', user: string, country: string): Promise<ProjectResponse[]>;
async function getAllData(transform: 'table' | 'dashboard' | 'raw', user: string, country: string) {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ProjectResponse[] = await fetcher(`${API_URL}/projects`);
    if (!data) return transform === 'table' || transform === 'raw' ? [] : null;
    
    if (transform === 'table') return transformToTableData(data);
    if (transform === 'dashboard') return transformToDashboardData(data);
    return data;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return transform === 'table' || transform === 'raw' ? [] : null;
    }
    console.error('Error al obtener proyectos:', error);
    throw error;
  }
}

async function getById(id: string, user: string, country: string): Promise<ProjectUpdateWithId | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ProjectResponse = await fetcher(`${API_URL}/projects/${id}`);
    if (!data) return null;
    return {
      ...transformToUpdateData(data),
      id_project: data.id_project
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    console.error('Error al obtener proyecto:', error);
    throw error;
  }
}

async function deleteData(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    await fetcher(`${API_URL}/projects/${id}`, { method: 'DELETE' });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    console.error('Error al eliminar proyecto:', error);
    throw error;
  }
}

async function createData(data: ProjectCreate, user: string, country: string): Promise<ProjectResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear proyecto:', error);
    throw error;
  }
}

async function updateData(data: ProjectUpdateWithId, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    const { id_project, ...updateData } = data;
    await fetcher(`${API_URL}/projects/${id_project}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    console.error('Error al actualizar proyecto:', error);
    throw error;
  }
}

async function getObjectsById(id: string, user: string, country: string): Promise<ObjectTableData[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const data = await fetcher(`${API_URL}/projects/${id}/objects`);
    if (!data) return [];
    return objectTransformToTableData(data);
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    console.error('Error al obtener objetos del proyecto:', error);
    throw error;
  }
}

export { getAllData, getById, deleteData, createData, updateData, getObjectsById };