import { DictionaryBaseRawHeaderResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getDictionaryBaseRawHeaderByObjectId(objectId: string, user: string, country: string): Promise<DictionaryBaseRawHeaderResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/dictionary-base-raw-headers/object/${objectId}`);
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