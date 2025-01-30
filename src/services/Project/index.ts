import { ProjectCreate, ProjectDashboardData, ProjectResponse, ProjectTableData, ProjectUpdateWithId } from './types';
import { transformToTableData, transformToDashboardData, transformToUpdateData } from './transforms';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';
import { ObjectTableData } from '../Object/types';
import { transformToTableData as objectTransformToTableData } from '../Object/transforms';

function getAllData(transform: 'table', user: string, country: string): Promise<ProjectTableData[]>;
function getAllData(transform: 'dashboard', user: string, country: string): Promise<ProjectDashboardData>;
function getAllData(transform: 'raw', user: string, country: string): Promise<ProjectResponse[]>;
async function getAllData(transform: 'table' | 'dashboard' | 'raw', user: string, country: string) {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ProjectResponse[] = await fetcher(`${API_CONFIG.BASE_URL}/projects`);
    if (!data) return transform === 'table' || transform === 'raw' ? [] : null;
    
    if (transform === 'table') return transformToTableData(data);
    if (transform === 'dashboard') return transformToDashboardData(data);
    return data;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return transform === 'table' || transform === 'raw' ? [] : null;
    }
    throw new Error('Error al obtener proyectos: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function getById(id: string, user: string, country: string): Promise<ProjectUpdateWithId | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ProjectResponse = await fetcher(`${API_CONFIG.BASE_URL}/projects/${id}`);
    if (!data) return null;
    return {
      ...transformToUpdateData(data),
      id_project: data.id_project
    };
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw new Error('Error al obtener proyecto por ID: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function createData(data: ProjectCreate, user: string, country: string): Promise<ProjectResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al crear proyecto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function updateData(data: ProjectUpdateWithId, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    const { id_project, ...updateData } = data;
    await fetcher(`${API_CONFIG.BASE_URL}/projects/${id_project}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Proyecto no encontrado');
    }
    throw new Error('Error al actualizar proyecto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function deleteData(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    await fetcher(`${API_CONFIG.BASE_URL}/projects/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    throw new Error('Error al eliminar proyecto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function getObjectsById(id: string, user: string, country: string): Promise<ObjectTableData[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const data = await fetcher(`${API_CONFIG.BASE_URL}/projects/${id}/objects`);
    if (!data) return [];
    return objectTransformToTableData(data);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    throw new Error('Error al obtener objetos del proyecto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export { getAllData, getById, deleteData, createData, updateData, getObjectsById };