import { ProjectCreate, ProjectDashboardData, ProjectResponse, ProjectTableData, ProjectUpdateWithId } from './types';
import { transformToTableData, transformToDashboardData, transformToUpdateData } from './transforms';
import { ObjectTableData } from '../Object/types';
import { transformToTableData as objectTransformToTableData } from '../Object/transforms';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAllData(transform: 'table'): Promise<ProjectTableData[]>;
function getAllData(transform: 'dashboard'): Promise<ProjectDashboardData>;
function getAllData(transform: 'raw'): Promise<ProjectResponse[]>;
async function getAllData(transform: 'table' | 'dashboard' | 'raw') {
  try {
    const response = await fetch(`${API_URL}/projects`);
    if (!response.ok) throw new Error('Error al obtener proyectos');
    const data: ProjectResponse[] = await response.json();
    
    if (transform === 'table') return transformToTableData(data);
    if (transform === 'dashboard') return transformToDashboardData(data);
    return data;
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    throw error;
  }
}

async function getById(id: string): Promise<ProjectUpdateWithId> {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`);
    if (!response.ok) throw new Error('Error al obtener proyecto');
    const data: ProjectResponse = await response.json();
    return {
      ...transformToUpdateData(data),
      id_project: data.id_project
    };
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    throw error;
  }
}

async function deleteData(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar proyecto');
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    throw error;
  }
}

async function createData(data: ProjectCreate): Promise<ProjectResponse> {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear proyecto');
    return await response.json();
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    throw error;
  }
}

async function updateData(data: ProjectUpdateWithId): Promise<void> {
  try {
    const { id_project, ...updateData } = data;
    const response = await fetch(`${API_URL}/projects/${id_project}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar proyecto');
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    throw error;
  }
}

async function getObjectsById(id: string): Promise<ObjectTableData[]> {
  try {
    const response = await fetch(`${API_URL}/projects/${id}/objects`);
    if (!response.ok) throw new Error('Error al obtener objetos del proyecto');
    const data = await response.json();
    return objectTransformToTableData(data);
  } catch (error) {
    console.error('Error al obtener objetos del proyecto:', error);
    throw error;
  }
}

export { getAllData, getById, deleteData, createData, updateData, getObjectsById };