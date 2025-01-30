import { DictionaryJsonDetailResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getDictionaryJsonDetailsByHeaderId(headerId: string, user: string, country: string): Promise<DictionaryJsonDetailResponse[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/dictionary-json-details/header/${headerId}`);
    if (!response) return [];
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    
    throw new Error('Error al obtener detalles del diccionario JSON: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getDictionaryJsonDetailsByHeaderId
}; 