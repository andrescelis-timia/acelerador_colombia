import { IngestaOutputResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getIngestaOutputByObjectId(objectId: string, user: string, country: string): Promise<IngestaOutputResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/ingesta-outputs/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    
    throw new Error('Error al obtener ingesta output: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  getIngestaOutputByObjectId
}; 