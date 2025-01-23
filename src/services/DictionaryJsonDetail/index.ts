import { DictionaryJsonDetailResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getDictionaryJsonDetailsByHeaderId(headerId: string, user: string, country: string): Promise<DictionaryJsonDetailResponse[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_URL}/dictionary-json-details/header/${headerId}`);
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