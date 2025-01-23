import { ObjectCreate, ObjectUpdateWithId, ObjectResponse, ObjectTableData } from './types';
import { transformToTableData, transformToUpdateData } from './transforms';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

function getAllData(transform: 'table', user: string, country: string): Promise<ObjectTableData[]>;
function getAllData(transform: 'raw', user: string, country: string): Promise<ObjectResponse[]>;
async function getAllData(transform: 'table' | 'raw', user: string, country: string) {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ObjectResponse[] = await fetcher(`${API_CONFIG.BASE_URL}/objects`);
    if (!data) return [];
    
    if (transform === 'table') return transformToTableData(data);
    return data;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    console.error('Error al obtener objetos:', error);
    throw error;
  }
}

async function getById(id: string, user: string, country: string): Promise<ObjectUpdateWithId | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ObjectResponse = await fetcher(`${API_CONFIG.BASE_URL}/objects/${id}`);
    if (!data) return null;
    return transformToUpdateData(data);
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    console.error('Error al obtener objeto:', error);
    throw error;
  }
}

async function createData(data: ObjectCreate, user: string, country: string): Promise<ObjectResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/objects`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear objeto:', error);
    throw error;
  }
}

async function updateData(data: ObjectUpdateWithId, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    const { id_object, ...updateData } = data;
    await fetcher(`${API_CONFIG.BASE_URL}/objects/${id_object}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    console.error('Error al actualizar objeto:', error);
    throw error;
  }
}

async function deleteData(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    await fetcher(`${API_CONFIG.BASE_URL}/objects/${id}`, {
      method: 'DELETE'
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    console.error('Error al eliminar objeto:', error);
    throw error;
  }
}

export { getAllData, getById, createData, updateData, deleteData }; 