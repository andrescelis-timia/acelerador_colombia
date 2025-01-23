import { DictionaryBaseRawHeaderResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getDictionaryBaseRawHeaderByObjectId(objectId: string, user: string, country: string): Promise<DictionaryBaseRawHeaderResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_URL}/dictionary-base-raw-headers/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    
    console.error('Error al obtener diccionario base raw header:', error);
    throw error;
  }
}

export {
  getDictionaryBaseRawHeaderByObjectId
}; 