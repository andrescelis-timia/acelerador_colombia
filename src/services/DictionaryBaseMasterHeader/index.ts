import { DictionaryBaseMasterHeaderResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getDictionaryBaseMasterHeaderByObjectId(objectId: string, user: string, country: string): Promise<DictionaryBaseMasterHeaderResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/dictionary-base-master-headers/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    
    console.error('Error al obtener diccionario base master header:', error);
    throw error;
  }
}

export {
  getDictionaryBaseMasterHeaderByObjectId
}; 