import { DictionaryJsonHeaderResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getDictionaryJsonHeader(objectId: string, user: string, country: string): Promise<DictionaryJsonHeaderResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/dictionary-json-headers/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    
    throw new Error('Error al obtener diccionario JSON header: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getDictionaryJsonHeader
}; 