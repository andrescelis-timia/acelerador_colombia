import { ObjectCreate, ObjectUpdateWithId, ObjectResponse, ObjectTableData } from './types';
import { transformToTableData, transformToUpdateData } from './transforms';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAllData(transform: 'table'): Promise<ObjectTableData[]>;
function getAllData(transform: 'raw'): Promise<ObjectResponse[]>;
async function getAllData(transform: 'table' | 'raw') {
  try {
    const response = await fetch(`${API_URL}/objects`);
    if (!response.ok) throw new Error('Error al obtener objetos');
    const data: ObjectResponse[] = await response.json();
    
    if (transform === 'table') return transformToTableData(data);
    return data;
  } catch (error) {
    console.error('Error al obtener objetos:', error);
    throw error;
  }
}

async function getById(id: string): Promise<ObjectUpdateWithId> {
  try {
    const response = await fetch(`${API_URL}/objects/${id}`);
    if (!response.ok) throw new Error('Error al obtener objeto');
    const data: ObjectResponse = await response.json();
    return transformToUpdateData(data);
  } catch (error) {
    console.error('Error al obtener objeto:', error);
    throw error;
  }
}

async function createData(data: ObjectCreate): Promise<ObjectResponse> {
  try {
    const response = await fetch(`${API_URL}/objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear objeto');
    return await response.json();
  } catch (error) {
    console.error('Error al crear objeto:', error);
    throw error;
  }
}

async function updateData(data: ObjectUpdateWithId): Promise<void> {
  try {
    const { id_object, ...updateData } = data;
    const response = await fetch(`${API_URL}/objects/${id_object}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar objeto');
  } catch (error) {
    console.error('Error al actualizar objeto:', error);
    throw error;
  }
}

async function deleteData(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/objects/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar objeto');
  } catch (error) {
    console.error('Error al eliminar objeto:', error);
    throw error;
  }
}

export { getAllData, getById, createData, updateData, deleteData }; 