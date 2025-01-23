import { CreatePreDictionaryInput, UpdatePreDictionaryInput, PreDictionaryInputResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getPreDictionaryInputById(id: string, user: string, country: string): Promise<PreDictionaryInputResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_URL}/pre-dictionary-inputs/${id}`);
    if (!response) return null;
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    console.error('Error al obtener pre dictionary input:', error);
    throw error;
  }
}

async function getPreDictionaryInputByObjectId(objectId: string, user: string, country: string): Promise<PreDictionaryInputResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_URL}/pre-dictionary-inputs/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    console.error('Error al obtener pre dictionary input por object ID:', error);
    throw error;
  }
}

async function createPreDictionaryInput(data: CreatePreDictionaryInput, user: string, country: string): Promise<PreDictionaryInputResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_URL}/pre-dictionary-inputs`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear pre dictionary input:', error);
    throw error;
  }
}

async function updatePreDictionaryInput(id: string, data: UpdatePreDictionaryInput, user: string, country: string): Promise<PreDictionaryInputResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_URL}/pre-dictionary-inputs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Pre dictionary input no encontrado');
    }
    console.error('Error al actualizar pre dictionary input:', error);
    throw error;
  }
}

async function deletePreDictionaryInput(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  
  try {
    await fetcher(`${API_URL}/pre-dictionary-inputs/${id}`, {
      method: 'DELETE'
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    console.error('Error al eliminar pre dictionary input:', error);
    throw error;
  }
}

export {
  getPreDictionaryInputById,
  getPreDictionaryInputByObjectId,
  createPreDictionaryInput,
  updatePreDictionaryInput,
  deletePreDictionaryInput
}; 