import { DictionaryBaseMasterHeaderResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getDictionaryBaseMasterHeaderByObjectId(objectId: string, user: string, country: string): Promise<DictionaryBaseMasterHeaderResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_URL}/dictionary-base-master-headers/object/${objectId}`);
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