import { CreatePreDictionaryInput, UpdatePreDictionaryInput, PreDictionaryInputResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getPreDictionaryInputById(id: string, user: string, country: string): Promise<PreDictionaryInputResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/pre-dictionary-inputs/${id}`);
    if (!response) return null;
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw new Error('Error al obtener pre dictionary input: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function getPreDictionaryInputByObjectId(objectId: string, user: string, country: string): Promise<PreDictionaryInputResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/pre-dictionary-inputs/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw new Error('Error al obtener pre dictionary input por object ID: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function createPreDictionaryInput(data: CreatePreDictionaryInput, user: string, country: string): Promise<PreDictionaryInputResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/pre-dictionary-inputs`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al crear pre dictionary input: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function updatePreDictionaryInput(id: string, data: UpdatePreDictionaryInput, user: string, country: string): Promise<PreDictionaryInputResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/pre-dictionary-inputs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Pre dictionary input no encontrado');
    }
    throw new Error('Error al actualizar pre dictionary input: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function deletePreDictionaryInput(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    await fetcher(`${API_CONFIG.BASE_URL}/pre-dictionary-inputs/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return; // Si no existe, consideramos que ya está eliminado
    }
    throw new Error('Error al eliminar pre dictionary input: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getPreDictionaryInputById,
  getPreDictionaryInputByObjectId,
  createPreDictionaryInput,
  updatePreDictionaryInput,
  deletePreDictionaryInput
}; 