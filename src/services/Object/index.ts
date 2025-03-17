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
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    throw new Error('Error al obtener objetos: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function getById(id: string, user: string, country: string): Promise<ObjectUpdateWithId | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const data: ObjectResponse = await fetcher(`${API_CONFIG.BASE_URL}/objects/${id}`);
    if (!data) return null;
    return transformToUpdateData(data);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw new Error('Error al obtener objeto por ID: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function createData(data: ObjectCreate, user: string, country: string): Promise<ObjectResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/objects`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al crear objeto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
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
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Objeto no encontrado');
    }
    throw new Error('Error al actualizar objeto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function deleteData(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    await fetcher(`${API_CONFIG.BASE_URL}/objects/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Objeto no encontrado');
    }
    throw new Error('Error al eliminar objeto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function archiveData(id: string, user: string, country: string): Promise<ObjectResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/objects/${id}/archive`, {
      method: 'PUT'
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Objeto no encontrado');
    }
    throw new Error('Error al archivar objeto: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export { getAllData, getById, createData, updateData, deleteData, archiveData }; 