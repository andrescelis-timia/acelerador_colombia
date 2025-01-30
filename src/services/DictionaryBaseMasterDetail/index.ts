import { DictionaryBaseMasterDetailResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getDictionaryBaseMasterDetailsByHeaderId(headerId: string, user: string, country: string): Promise<DictionaryBaseMasterDetailResponse[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/dictionary-base-master-details/header/${headerId}`);
    if (!response) return [];
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    
    throw new Error('Error al obtener detalles del diccionario base master: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getDictionaryBaseMasterDetailsByHeaderId
}; 