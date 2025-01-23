import { DictionaryJsonDetailResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getDictionaryJsonDetailsByHeaderId(headerId: string, user: string, country: string): Promise<DictionaryJsonDetailResponse[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/dictionary-json-details/header/${headerId}`);
    if (!response) return [];
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    
    console.error('Error al obtener detalles del diccionario:', error);
    throw error;
  }
}

export {
  getDictionaryJsonDetailsByHeaderId
}; 